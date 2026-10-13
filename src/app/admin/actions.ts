"use server";

import { revalidatePath } from "next/cache";
import type { UserActionResult } from "../../interface/users/UserService";
import { authService } from "../../logic/auth/AuthService";
import { userService } from "../../logic/users/UserService";
import { hasRoleAtLeast, type UserRole } from "../../models/UserRole";

const NOT_ALLOWED: UserActionResult = { ok: false, error: "You are not allowed to manage users." };
const ROLES: UserRole[] = ["viewer", "editor", "admin"];

// Server actions can be called directly with a POST request, so each one checks that the signed-in user is an admin.
async function getAdminId(): Promise<string | null> {
    const user = await authService.getCurrentUser();
    return user && hasRoleAtLeast(user.role, "admin") ? user.id : null;
}

export async function changeRoleAction(userId: string, role: string): Promise<UserActionResult> {
    const adminId: string | null = await getAdminId();
    if (!adminId) {
        return NOT_ALLOWED;
    }
    // The value comes from the browser, so it is checked here and not trusted.
    if (!ROLES.includes(role as UserRole)) {
        return { ok: false, error: "Choose a valid role." };
    }
    const result = await userService.changeRole(adminId, userId, role as UserRole);
    if (result.ok) {
        revalidatePath("/admin");
    }
    return result;
}

export async function unlockUserAction(userId: string): Promise<UserActionResult> {
    if (!(await getAdminId())) {
        return NOT_ALLOWED;
    }
    const result = await userService.unlockUser(userId);
    if (result.ok) {
        revalidatePath("/admin");
    }
    return result;
}
