import "server-only";
import type {
    IAccountStatus,
    IEmployeeListResult,
    IOwnProfileStatus,
    IProfileService,
    SaveProfileResult,
} from "../../interface/profiles/ProfileService";
import { AuditAction, type AuditActor } from "../../models/Audit";
import type { IEditorAccount, IEditorAccountFilter } from "../../models/EditorAccount";
import { newStarterDates, type IEmployee, type IEmployeeFilter, type INewStarterDates } from "../../models/Employee";
import { validateProfileForm, type IProfileFormValues } from "../../models/ProfileForm";
import { photoUrl } from "../../models/Photo";
import type { IPage } from "../../models/Paging";
import { ProfileStatus } from "../../models/ProfileStatus";
import { db } from "../../prisma/Database";
import type { Prisma, Profile } from "../../prisma/generated/client";
import { ClientUtils } from "../../utils/ClientUtils";
import { ServerUtils } from "../../utils/ServerUtils";
import { recordAuditEvent } from "../audit/AuditRecorder";
import { changedProfileFields, toDatabaseData, type ProfileDatabaseData } from "./ProfileMapping";

/**
 * One condition per search word for the employee list: the word must appear, in any case, in the name, preferred name,
 * position or one of the three profile text sections.
 */
function employeeSearchConditions(search: string): Prisma.ProfileWhereInput[] {
    const conditions: Prisma.ProfileWhereInput[] = [];
    for (const word of ServerUtils.searchWords(search)) {
        const contains = ServerUtils.containsText(word);
        conditions.push({
            OR: [
                { firstName: contains },
                { lastName: contains },
                { preferredName: contains },
                { position: contains },
                { hobbies: contains },
                { somethingInteresting: contains },
                { background: contains },
            ],
        });
    }
    return conditions;
}

/**
 * Published profiles that match the employee list filter. A start date that is not a valid ISO date is ignored.
 * When `userEmails` is supplied and `filter.status` is not "all", the query is also filtered to profiles whose
 * company email is (or is not) in that set.
 */
function publishedEmployeeConditions(filter: IEmployeeFilter, userEmails?: string[]): Prisma.ProfileWhereInput {
    const where: Prisma.ProfileWhereInput = {
        status: ProfileStatus.Published,
        AND: employeeSearchConditions(filter.search),
    };
    if (ClientUtils.isIsoDate(filter.startedFrom)) {
        where.startDate = { gte: ClientUtils.fromUtcIsoDate(filter.startedFrom) };
    }
    if (filter.status !== "all" && userEmails !== undefined) {
        where.companyEmail = filter.status === "linked" ? { in: userEmails } : { notIn: userEmails };
    }
    return where;
}

/** One condition per search word for the editor list: the word must appear in the name, preferred name, email or position. */
function editorSearchConditions(search: string): Prisma.ProfileWhereInput[] {
    const conditions: Prisma.ProfileWhereInput[] = [];
    for (const word of ServerUtils.searchWords(search)) {
        const contains = ServerUtils.containsText(word);
        conditions.push({
            OR: [
                { firstName: contains },
                { lastName: contains },
                { preferredName: contains },
                { companyEmail: contains },
                { position: contains },
            ],
        });
    }
    return conditions;
}

/** Name order for profile lists; the id breaks ties so every page holds the same people each time it is loaded. */
const PROFILE_ORDER: Prisma.ProfileOrderByWithRelationInput[] = [
    { firstName: "asc" },
    { lastName: "asc" },
    { id: "asc" },
];

/**
 * Published profiles matching the condition, as employee list rows, with whether each has a linked account. `skip` and
 * `take` select one page; leaving them out returns every match.
 */
async function findEmployees(where: Prisma.ProfileWhereInput, skip?: number, take?: number): Promise<IEmployee[]> {
    const profiles = await db.profile.findMany({
        where,
        // Only when the photo was last changed is read, never the image itself, so the list stays light.
        include: { photo: { select: { updatedAt: true } } },
        orderBy: PROFILE_ORDER,
        skip,
        take,
    });
    const linkedUsers = await db.user.findMany({
        where: { email: { in: profiles.map((profile: Profile) => profile.companyEmail) } },
        select: { email: true },
    });
    const linkedEmails = new Set<string>(linkedUsers.map((user: { email: string }) => user.email));
    return profiles.map((profile) => ({
        id: profile.id,
        name: fullName(profile),
        position: profile.position ?? "",
        startDate: ClientUtils.toUtcIsoDate(profile.startDate),
        preferredName: profile.preferredName ?? "",
        hobbies: profile.hobbies ?? "",
        hasAccount: linkedEmails.has(profile.companyEmail),
        photoUrl: profile.photo ? photoUrl(profile.id, profile.photo.updatedAt) : null,
    }));
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
        startDate: ClientUtils.toUtcIsoDate(profile.startDate),
        companyEmail: profile.companyEmail,
        linkedIn: profile.linkedIn ?? "",
        hobbies: profile.hobbies ?? "",
        somethingInteresting: profile.somethingInteresting ?? "",
        background: profile.background ?? "",
    };
}

async function findProfile(profileId: string): Promise<Profile | null> {
    if (!ClientUtils.isUuid(profileId)) {
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
        if (!ClientUtils.isUuid(userId)) {
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
        return profile && profile.status === ProfileStatus.Published ? toFormValues(profile) : null;
    },

    async getAccountStatus(profileId: string): Promise<IAccountStatus> {
        const profile = await findProfile(profileId);
        const user = profile ? await db.user.findUnique({ where: { email: profile.companyEmail } }) : null;
        return { hasAccount: user !== null, isLocked: user?.lockedAt != null };
    },

    async listEditorAccounts(filter: IEditorAccountFilter): Promise<IPage<IEditorAccount>> {
        const startedFrom: Date | null = ClientUtils.isIsoDate(filter.startedFrom)
            ? ClientUtils.fromUtcIsoDate(filter.startedFrom)
            : null;
        // Profiles and accounts are linked by email, so every email of each is needed to tell which ones are linked.
        const [allUsers, allProfiles] = await Promise.all([
            db.user.findMany({ select: { email: true } }),
            db.profile.findMany({ select: { companyEmail: true } }),
        ]);
        const userEmails: string[] = allUsers.map((user: { email: string }) => user.email);
        const profileEmails: string[] = allProfiles.map((profile: { companyEmail: string }) => profile.companyEmail);

        let profileWhere: Prisma.ProfileWhereInput | null = null;
        if (filter.status !== "no-profile") {
            profileWhere = { AND: editorSearchConditions(filter.search) };
            if (startedFrom) {
                profileWhere.startDate = { gte: startedFrom };
            }
            if (filter.status === "not-linked") {
                profileWhere.companyEmail = { notIn: userEmails };
            }
        }
        // Accounts without a profile have no start date, so they are listed only when no start date is chosen.
        let userWhere: Prisma.UserWhereInput | null = null;
        if (filter.status !== "not-linked" && startedFrom === null) {
            userWhere = {
                email: { notIn: profileEmails },
                AND: ServerUtils.searchWords(filter.search).map((word: string) => ({
                    email: ServerUtils.containsText(word),
                })),
            };
        }

        const [profileCount, userCount] = await Promise.all([
            profileWhere ? db.profile.count({ where: profileWhere }) : Promise.resolve(0),
            userWhere ? db.user.count({ where: userWhere }) : Promise.resolve(0),
        ]);
        const totalCount: number = profileCount + userCount;
        const page: number = ClientUtils.clampPage(filter.page, totalCount, filter.pageSize);

        // The list shows profiles first, then accounts without a profile, so one page can hold some of each.
        const skip: number = (page - 1) * filter.pageSize;
        const profileTake: number = Math.max(0, Math.min(filter.pageSize, profileCount - skip));
        const userTake: number = filter.pageSize - profileTake;
        const [profiles, users] = await Promise.all([
            profileWhere && profileTake > 0
                ? db.profile.findMany({ where: profileWhere, orderBy: PROFILE_ORDER, skip, take: profileTake })
                : Promise.resolve([]),
            userWhere && userTake > 0
                ? db.user.findMany({
                      where: userWhere,
                      select: { id: true, email: true, profileRequestedAt: true },
                      orderBy: { email: "asc" },
                      skip: Math.max(0, skip - profileCount),
                      take: userTake,
                  })
                : Promise.resolve([]),
        ]);

        const linkedEmails = new Set<string>(userEmails);
        const accounts: IEditorAccount[] = [];
        for (const profile of profiles) {
            accounts.push({
                id: profile.id,
                name: fullName(profile),
                email: profile.companyEmail,
                position: profile.position,
                startDate: ClientUtils.toUtcIsoDate(profile.startDate) || null,
                hasProfile: true,
                hasAccount: linkedEmails.has(profile.companyEmail),
                profileRequested: false,
                profileStatus: profile.status as ProfileStatus,
            });
        }
        for (const user of users) {
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
        return { items: accounts, page, pageSize: filter.pageSize, totalCount };
    },

    async listPublishedEmployees(filter: IEmployeeFilter): Promise<IEmployeeListResult> {
        const userEmails: string[] = (await db.user.findMany({ select: { email: true } })).map(
            (u: { email: string }) => u.email,
        );
        const where: Prisma.ProfileWhereInput = publishedEmployeeConditions(filter, userEmails);
        const publishedWhere: Prisma.ProfileWhereInput = { status: ProfileStatus.Published };
        const [filteredCount, linkedCount, totalPublishedCount] = await Promise.all([
            db.profile.count({ where }),
            db.profile.count({ where: { ...publishedWhere, companyEmail: { in: userEmails } } }),
            db.profile.count({ where: publishedWhere }),
        ]);
        const page: number = ClientUtils.clampPage(filter.page, filteredCount, filter.pageSize);
        const items: IEmployee[] = await findEmployees(where, (page - 1) * filter.pageSize, filter.pageSize);
        return {
            page: { items, page, pageSize: filter.pageSize, totalCount: filteredCount },
            linkedCount,
            pendingCount: totalPublishedCount - linkedCount,
        };
    },

    async listNewStarters(filter: IEmployeeFilter): Promise<IEmployee[]> {
        const dates: INewStarterDates = newStarterDates(new Date());
        return findEmployees({
            AND: [
                publishedEmployeeConditions(filter),
                {
                    startDate: {
                        gte: ClientUtils.fromUtcIsoDate(dates.earliest),
                        lte: ClientUtils.fromUtcIsoDate(dates.latest),
                    },
                },
            ],
        });
    },

    async createProfile(values: IProfileFormValues, actor: AuditActor): Promise<SaveProfileResult> {
        // Validated here as well as in the form: the form check can be bypassed.
        const errors = validateProfileForm(values);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors };
        }
        try {
            return await db.$transaction(async (tx: Prisma.TransactionClient): Promise<SaveProfileResult> => {
                const profile = await tx.profile.create({
                    data: { ...toDatabaseData(values), status: ProfileStatus.Published, publishedAt: new Date() },
                });
                await recordAuditEvent(tx, {
                    action: AuditAction.ProfileCreated,
                    actor,
                    targetId: profile.id,
                    targetEmail: profile.companyEmail,
                });
                return { ok: true, profileId: profile.id };
            });
        } catch (error) {
            if (ServerUtils.hasPrismaCode(error, "P2002")) {
                return { ok: false, errors: { companyEmail: "That email already has a profile." } };
            }
            throw error;
        }
    },

    async updateProfile(profileId: string, values: IProfileFormValues, actor: AuditActor): Promise<SaveProfileResult> {
        const errors = validateProfileForm(values);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors };
        }
        if (!ClientUtils.isUuid(profileId)) {
            return { ok: false, errors: { companyEmail: "This profile no longer exists." } };
        }
        try {
            return await db.$transaction(async (tx: Prisma.TransactionClient): Promise<SaveProfileResult> => {
                const existing = await tx.profile.findUnique({ where: { id: profileId } });
                if (!existing) {
                    return { ok: false, errors: { companyEmail: "This profile no longer exists." } };
                }
                const data: ProfileDatabaseData = toDatabaseData(values);
                const changedFields: string[] = changedProfileFields(existing, data);
                const profile = await tx.profile.update({ where: { id: profileId }, data });
                // Saving without changing anything is not worth a record.
                if (changedFields.length > 0) {
                    await recordAuditEvent(tx, {
                        action: AuditAction.ProfileUpdated,
                        actor,
                        targetId: profile.id,
                        targetEmail: profile.companyEmail,
                        details: { fields: changedFields },
                    });
                }
                return { ok: true, profileId: profile.id };
            });
        } catch (error) {
            if (ServerUtils.hasPrismaCode(error, "P2002")) {
                return { ok: false, errors: { companyEmail: "That email already has a profile." } };
            }
            if (ServerUtils.hasPrismaCode(error, "P2025")) {
                return { ok: false, errors: { companyEmail: "This profile no longer exists." } };
            }
            throw error;
        }
    },

    async getProfileStatus(profileId: string): Promise<ProfileStatus | null> {
        const profile = await findProfile(profileId);
        return profile ? (profile.status as ProfileStatus) : null;
    },

    async publishProfile(profileId: string, actor: AuditActor): Promise<boolean> {
        if (!ClientUtils.isUuid(profileId)) {
            return false;
        }
        return db.$transaction(async (tx: Prisma.TransactionClient): Promise<boolean> => {
            // Only a profile the employee has submitted can be published; an invited one has nothing to review yet.
            const result = await tx.profile.updateMany({
                where: { id: profileId, status: ProfileStatus.AwaitingReview },
                data: { status: ProfileStatus.Published, publishedAt: new Date() },
            });
            if (result.count === 0) {
                return false;
            }
            const profile = await tx.profile.findUniqueOrThrow({
                where: { id: profileId },
                select: { companyEmail: true },
            });
            await recordAuditEvent(tx, {
                action: AuditAction.ProfilePublished,
                actor,
                targetId: profileId,
                targetEmail: profile.companyEmail,
            });
            return true;
        });
    },

    async countAwaitingReview(): Promise<number> {
        return db.profile.count({ where: { status: ProfileStatus.AwaitingReview } });
    },

    async deleteProfile(profileId: string, actor: AuditActor): Promise<boolean> {
        if (!ClientUtils.isUuid(profileId)) {
            return false;
        }
        return db.$transaction(async (tx: Prisma.TransactionClient): Promise<boolean> => {
            // The email is read first, because the record needs it after the profile is gone.
            const profile = await tx.profile.findUnique({ where: { id: profileId }, select: { companyEmail: true } });
            if (!profile) {
                return false;
            }
            const result = await tx.profile.deleteMany({ where: { id: profileId } });
            if (result.count === 0) {
                return false;
            }
            await recordAuditEvent(tx, {
                action: AuditAction.ProfileDeleted,
                actor,
                targetId: profileId,
                targetEmail: profile.companyEmail,
            });
            return true;
        });
    },
};
