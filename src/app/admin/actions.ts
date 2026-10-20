"use server";

import { revalidatePath } from "next/cache";
import type { UserActionResult } from "../../interface/users/UserService";
import { currentUserWithRole } from "../../logic/auth/RequireUser";
import { userService } from "../../logic/users/UserService";
import { userActor } from "../../models/Audit";
import { UserRole } from "../../models/UserRole";

const NOT_ALLOWED: UserActionResult = { ok: false, error: "You are not allowed to manage users." };
const ROLES: string[] = Object.values(UserRole);

// Server actions can be called directly with a POST request, so each one checks that the signed-in user is an admin.
export async function changeRoleAction(userId: string, role: string): Promise<UserActionResult> {
    const admin = await currentUserWithRole(UserRole.Admin);
    if (!admin) {
        return NOT_ALLOWED;
    }
    // The value comes from the browser, so it is checked here and not trusted.
    if (!ROLES.includes(role)) {
        return { ok: false, error: "Choose a valid role." };
    }
    const result = await userService.changeRole(userActor(admin), userId, role as UserRole);
    if (result.ok) {
        revalidatePath("/admin");
    }
    return result;
}

export async function unlockUserAction(userId: string): Promise<UserActionResult> {
    const admin = await currentUserWithRole(UserRole.Admin);
    if (!admin) {
        return NOT_ALLOWED;
    }
    const result = await userService.unlockUser(userActor(admin), userId);
    if (result.ok) {
        revalidatePath("/admin");
    }
    return result;
}
