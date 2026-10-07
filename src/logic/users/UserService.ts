import "server-only";
import type { IUserService, UserActionResult } from "../../interface/users/UserService";
import type { IUserAccount } from "../../models/UserAccount";
import type { UserRole } from "../../models/UserRole";
import { db } from "../../prisma/Database";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const userService: IUserService = {
    async listUsers(): Promise<IUserAccount[]> {
        const [users, profiles] = await Promise.all([
            db.user.findMany({ orderBy: { email: "asc" } }),
            db.profile.findMany({ select: { companyEmail: true, firstName: true, lastName: true } }),
        ]);
        const namesByEmail = new Map<string, string>();
        for (const profile of profiles) {
            const name: string = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
            if (name !== "") {
                namesByEmail.set(profile.companyEmail, name);
            }
        }
        return users.map((user) => ({
            id: user.id,
            // Accounts without a named profile show their email instead.
            name: namesByEmail.get(user.email) ?? user.email,
            email: user.email,
            role: user.role,
            isLocked: user.lockedAt !== null,
            lastSignIn: user.lastSignInAt ? user.lastSignInAt.toISOString().slice(0, 10) : null,
        }));
    },

    async changeRole(actorUserId: string, targetUserId: string, role: UserRole): Promise<UserActionResult> {
        if (!uuidPattern.test(targetUserId)) {
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
        if (!uuidPattern.test(userId)) {
            return { ok: false, error: "That user no longer exists." };
        }
        const result = await db.user.updateMany({
            where: { id: userId },
            data: { lockedAt: null, failedSignInAttempts: 0 },
        });
        return result.count > 0 ? { ok: true } : { ok: false, error: "That user no longer exists." };
    },
};
