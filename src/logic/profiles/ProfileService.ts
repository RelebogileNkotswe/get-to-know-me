import "server-only";
import type { IAccountStatus, IProfileService } from "../../interface/profiles/ProfileService";
import type { IEditorAccount } from "../../models/EditorAccount";
import type { IEmployee } from "../../models/Employee";
import type { IProfileFormValues } from "../../models/ProfileForm";
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
        const profiles = await db.profile.findMany({
            where: { status: "published" },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        });
        return profiles.map((profile: Profile) => ({
            id: profile.id,
            name: fullName(profile),
            position: profile.position ?? "",
            startDate: toIsoDate(profile.startDate),
        }));
    },
};
