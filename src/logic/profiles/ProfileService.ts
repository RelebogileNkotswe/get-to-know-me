import "server-only";
import type {
    IAccountStatus,
    IOwnProfileStatus,
    IProfileService,
    SaveProfileResult,
} from "../../interface/profiles/ProfileService";
import type { IEditorAccount } from "../../models/EditorAccount";
import { isNewStarter, type IEmployee } from "../../models/Employee";
import { validateProfileForm, type IProfileFormValues } from "../../models/ProfileForm";
import type { ProfileStatus } from "../../models/ProfileStatus";
import { db } from "../../prisma/Database";
import type { Profile } from "../../prisma/generated/client";
import { hasPrismaCode, toDatabaseData, uuidPattern } from "./ProfileMapping";

/** ISO date (e.g. 2026-09-14) for a date-only column, or an empty string. */
function toIsoDate(value: Date | null): string {
    return value ? value.toISOString().slice(0, 10) : "";
}

function fullName(profile: Profile): string {
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.companyEmail;
}

// The form works with strings, so a field that was not entered (null) becomes an empty string.
function toFormValues(profile: Profile): IProfileFormValues {
    return {
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        preferredName: profile.preferredName ?? "",
        position: profile.position ?? "",
        startDate: toIsoDate(profile.startDate),
        companyEmail: profile.companyEmail,
        linkedIn: profile.linkedIn ?? "",
        hobbies: profile.hobbies ?? "",
        somethingInteresting: profile.somethingInteresting ?? "",
        background: profile.background ?? "",
    };
}

async function findProfile(profileId: string): Promise<Profile | null> {
    if (!uuidPattern.test(profileId)) {
        return null;
    }
    return db.profile.findUnique({ where: { id: profileId } });
}

export const profileService: IProfileService = {
    async getOwnProfileStatus(email: string): Promise<IOwnProfileStatus> {
        const [profile, user] = await Promise.all([
            db.profile.findUnique({ where: { companyEmail: email }, select: { id: true } }),
            db.user.findUnique({ where: { email }, select: { profileRequestedAt: true } }),
        ]);
        return { hasProfile: profile !== null, profileRequested: user?.profileRequestedAt != null };
    },

    async requestProfile(userId: string): Promise<void> {
        if (!uuidPattern.test(userId)) {
            return;
        }
        const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!user) {
            return;
        }
        const profile = await db.profile.findUnique({ where: { companyEmail: user.email }, select: { id: true } });
        if (profile === null) {
            await db.user.update({ where: { id: userId }, data: { profileRequestedAt: new Date() } });
        }
    },

    async getProfile(profileId: string): Promise<IProfileFormValues | null> {
        const profile = await findProfile(profileId);
        return profile ? toFormValues(profile) : null;
    },

    async getPublishedProfile(profileId: string): Promise<IProfileFormValues | null> {
        const profile = await findProfile(profileId);
        return profile && profile.status === "published" ? toFormValues(profile) : null;
    },

    async getAccountStatus(profileId: string): Promise<IAccountStatus> {
        const profile = await findProfile(profileId);
        const user = profile ? await db.user.findUnique({ where: { email: profile.companyEmail } }) : null;
        return { hasAccount: user !== null, isLocked: user?.lockedAt != null };
    },

    async listEditorAccounts(): Promise<IEditorAccount[]> {
        const [profiles, users] = await Promise.all([
            db.profile.findMany({ orderBy: [{ firstName: "asc" }, { lastName: "asc" }] }),
            db.user.findMany({
                select: { id: true, email: true, profileRequestedAt: true },
                orderBy: { email: "asc" },
            }),
        ]);
        const profileEmails = new Set<string>(profiles.map((profile: Profile) => profile.companyEmail));
        const userEmails = new Set<string>(users.map((user: { email: string }) => user.email));

        const accounts: IEditorAccount[] = profiles.map((profile: Profile) => ({
            id: profile.id,
            name: fullName(profile),
            email: profile.companyEmail,
            position: profile.position,
            startDate: toIsoDate(profile.startDate) || null,
            hasProfile: true,
            hasAccount: userEmails.has(profile.companyEmail),
            profileRequested: false,
            profileStatus: profile.status,
        }));
        for (const user of users) {
            if (!profileEmails.has(user.email)) {
                // Accounts without a profile have no name yet, so the email stands in for it.
                accounts.push({
                    id: user.id,
                    name: user.email,
                    email: user.email,
                    position: null,
                    startDate: null,
                    hasProfile: false,
                    hasAccount: true,
                    profileRequested: user.profileRequestedAt !== null,
                    profileStatus: null,
                });
            }
        }
        return accounts;
    },

    async listPublishedEmployees(): Promise<IEmployee[]> {
        const [profiles, users] = await Promise.all([
            db.profile.findMany({
                where: { status: "published" },
                orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            }),
            db.user.findMany({ select: { email: true } }),
        ]);
        const userEmails = new Set<string>(users.map((user: { email: string }) => user.email));
        const today = new Date();
        return profiles.map((profile: Profile) => ({
            id: profile.id,
            name: fullName(profile),
            position: profile.position ?? "",
            startDate: toIsoDate(profile.startDate),
            preferredName: profile.preferredName ?? "",
            hobbies: profile.hobbies ?? "",
            somethingInteresting: profile.somethingInteresting ?? "",
            background: profile.background ?? "",
            hasAccount: userEmails.has(profile.companyEmail),
            isNewStarter: isNewStarter(toIsoDate(profile.startDate), today),
        }));
    },

    async createProfile(values: IProfileFormValues): Promise<SaveProfileResult> {
        // Validated here as well as in the form: the form check can be bypassed.
        const errors = validateProfileForm(values);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors };
        }
        try {
            const profile = await db.profile.create({
                data: { ...toDatabaseData(values), status: "published", publishedAt: new Date() },
            });
            return { ok: true, profileId: profile.id };
        } catch (error) {
            if (hasPrismaCode(error, "P2002")) {
                return { ok: false, errors: { companyEmail: "That email already has a profile." } };
            }
            throw error;
        }
    },

    async updateProfile(profileId: string, values: IProfileFormValues): Promise<SaveProfileResult> {
        const errors = validateProfileForm(values);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors };
        }
        if (!uuidPattern.test(profileId)) {
            return { ok: false, errors: { companyEmail: "This profile no longer exists." } };
        }
        try {
            const profile = await db.profile.update({ where: { id: profileId }, data: toDatabaseData(values) });
            return { ok: true, profileId: profile.id };
        } catch (error) {
            if (hasPrismaCode(error, "P2002")) {
                return { ok: false, errors: { companyEmail: "That email already has a profile." } };
            }
            if (hasPrismaCode(error, "P2025")) {
                return { ok: false, errors: { companyEmail: "This profile no longer exists." } };
            }
            throw error;
        }
    },

    async getProfileStatus(profileId: string): Promise<ProfileStatus | null> {
        const profile = await findProfile(profileId);
        return profile ? profile.status : null;
    },

    async publishProfile(profileId: string): Promise<boolean> {
        if (!uuidPattern.test(profileId)) {
            return false;
        }
        // Only a profile the employee has submitted can be published; an invited one has nothing to review yet.
        const result = await db.profile.updateMany({
            where: { id: profileId, status: "awaiting_review" },
            data: { status: "published", publishedAt: new Date() },
        });
        return result.count > 0;
    },

    async countAwaitingReview(): Promise<number> {
        return db.profile.count({ where: { status: "awaiting_review" } });
    },

    async deleteProfile(profileId: string): Promise<boolean> {
        if (!uuidPattern.test(profileId)) {
            return false;
        }
        const result = await db.profile.deleteMany({ where: { id: profileId } });
        return result.count > 0;
    },
};
