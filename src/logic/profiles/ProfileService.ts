import "server-only";
import type { IAccountStatus, IProfileService, SaveProfileResult } from "../../interface/profiles/ProfileService";
import type { IEditorAccount } from "../../models/EditorAccount";
import type { IEmployee } from "../../models/Employee";
import { validateProfileForm, type IProfileFormValues } from "../../models/ProfileForm";
import { db } from "../../prisma/Database";
import type { Profile } from "../../prisma/generated/client";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** Trimmed text, or null when nothing was entered (the database stores "not entered" as null). */
function toNullable(value: string): string | null {
    const trimmed: string = value.trim();
    return trimmed === "" ? null : trimmed;
}

// Mirrors `toFormValues`: the email is trimmed and lowercased, empty fields become null.
function toDatabaseData(values: IProfileFormValues) {
    return {
        companyEmail: values.companyEmail.trim().toLowerCase(),
        firstName: toNullable(values.firstName),
        lastName: toNullable(values.lastName),
        preferredName: toNullable(values.preferredName),
        position: toNullable(values.position),
        startDate: values.startDate === "" ? null : new Date(`${values.startDate}T00:00:00Z`),
        linkedIn: toNullable(values.linkedIn),
        hobbies: toNullable(values.hobbies),
        somethingInteresting: toNullable(values.somethingInteresting),
        background: toNullable(values.background),
    };
}

/** True when a Prisma error has this code (P2002: unique value already used, P2025: record not found). */
function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

async function findProfile(profileId: string): Promise<Profile | null> {
    // Ids come from the URL; anything that is not a UUID cannot match and would make Postgres reject the query.
    if (!uuidPattern.test(profileId)) {
        return null;
    }
    return db.profile.findUnique({ where: { id: profileId } });
}

export const profileService: IProfileService = {
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
            db.user.findMany({ select: { id: true, email: true }, orderBy: { email: "asc" } }),
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
        return profiles.map((profile: Profile) => ({
            id: profile.id,
            name: fullName(profile),
            position: profile.position ?? "",
            startDate: toIsoDate(profile.startDate),
            hobbies: profile.hobbies ?? "",
            hasAccount: userEmails.has(profile.companyEmail),
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

    async deleteProfile(profileId: string): Promise<boolean> {
        if (!uuidPattern.test(profileId)) {
            return false;
        }
        const result = await db.profile.deleteMany({ where: { id: profileId } });
        return result.count > 0;
    },
};
