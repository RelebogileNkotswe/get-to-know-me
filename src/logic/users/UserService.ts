import "server-only";
import type { IUserService, UserActionResult } from "../../interface/users/UserService";
import type { IPage } from "../../models/Paging";
import type { IUserAccount, IUserAccountFilter } from "../../models/UserAccount";
import type { UserRole } from "../../models/UserRole";
import { db } from "../../prisma/Database";
import type { Prisma } from "../../prisma/generated/client";
import { ClientUtils } from "../../utils/ClientUtils";
import { ServerUtils } from "../../utils/ServerUtils";

/** One condition per search word: the word must appear, in any case, in the email or in the name on the user's profile. */
async function userSearchConditions(search: string): Promise<Prisma.UserWhereInput[]> {
    const conditions: Prisma.UserWhereInput[] = [];
    for (const word of ServerUtils.searchWords(search)) {
        const contains = ServerUtils.containsText(word);
        // Users and profiles are linked by email, so the profiles whose name matches give the emails to look for.
        const namedProfiles = await db.profile.findMany({
            where: { OR: [{ firstName: contains }, { lastName: contains }] },
            select: { companyEmail: true },
        });
        conditions.push({
            OR: [
                { email: contains },
                { email: { in: namedProfiles.map((profile: { companyEmail: string }) => profile.companyEmail) } },
            ],
        });
    }
    return conditions;
}

export const userService: IUserService = {
    async listUsers(filter: IUserAccountFilter): Promise<IPage<IUserAccount>> {
        const where: Prisma.UserWhereInput = { AND: await userSearchConditions(filter.search) };
        if (filter.role !== "all") {
            where.role = filter.role;
        }
        if (filter.lockStatus === "locked") {
            where.lockedAt = { not: null };
        } else if (filter.lockStatus === "active") {
            where.lockedAt = null;
        }
        if (ClientUtils.isIsoDate(filter.signedInSince)) {
            where.lastSignInAt = { gte: ClientUtils.fromUtcIsoDate(filter.signedInSince) };
        }
        const totalCount: number = await db.user.count({ where });
        const page: number = ClientUtils.clampPage(filter.page, totalCount, filter.pageSize);
        const users = await db.user.findMany({
            where,
            orderBy: { email: "asc" },
            skip: (page - 1) * filter.pageSize,
            take: filter.pageSize,
        });
        const profiles = await db.profile.findMany({
            where: { companyEmail: { in: users.map((user: { email: string }) => user.email) } },
            select: { companyEmail: true, firstName: true, lastName: true },
        });
        const namesByEmail = new Map<string, string>();
        for (const profile of profiles) {
            const name: string = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
            if (name !== "") {
                namesByEmail.set(profile.companyEmail, name);
            }
        }
        const items: IUserAccount[] = users.map((user) => ({
            id: user.id,
            // Accounts without a named profile show their email instead.
            name: namesByEmail.get(user.email) ?? user.email,
            email: user.email,
            role: user.role,
            isLocked: user.lockedAt !== null,
            lastSignIn: user.lastSignInAt ? user.lastSignInAt.toISOString().slice(0, 10) : null,
        }));
        return { items, page, pageSize: filter.pageSize, totalCount };
    },

    async changeRole(actorUserId: string, targetUserId: string, role: UserRole): Promise<UserActionResult> {
        if (!ClientUtils.isUuid(targetUserId)) {
            return { ok: false, error: "That user no longer exists." };
        }
        if (actorUserId === targetUserId) {
            return { ok: false, error: "You cannot change your own role." };
        }
        const target = await db.user.findUnique({ where: { id: targetUserId } });
        if (!target) {
            return { ok: false, error: "That user no longer exists." };
        }
        if (target.role === role) {
            return { ok: true };
        }
        if (target.role === "admin") {
            const adminCount: number = await db.user.count({ where: { role: "admin" } });
            if (adminCount <= 1) {
                return { ok: false, error: "There must always be at least one admin." };
            }
        }
        await db.user.update({ where: { id: targetUserId }, data: { role } });
        return { ok: true };
    },

    async unlockUser(userId: string): Promise<UserActionResult> {
        if (!ClientUtils.isUuid(userId)) {
            return { ok: false, error: "That user no longer exists." };
        }
        const result = await db.user.updateMany({
            where: { id: userId },
            data: { lockedAt: null, failedSignInAttempts: 0 },
        });
        return result.count > 0 ? { ok: true } : { ok: false, error: "That user no longer exists." };
    },
};
