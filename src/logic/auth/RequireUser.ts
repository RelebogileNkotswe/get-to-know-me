import "server-only";
import { redirect } from "next/navigation";
import type { ICurrentUser } from "../../models/CurrentUser";
import { hasRoleAtLeast, type UserRole } from "../../models/UserRole";
import { authService } from "./AuthService";

/**
 * Returns the signed-in user, sending anyone else to the login page. Every page calls this, because the proxy only checks that a
 * session cookie exists. A signed-in user without the minimum role is sent back to the employee list.
 */
export async function requireUser(minimumRole: UserRole = "viewer"): Promise<ICurrentUser> {
    const user: ICurrentUser | null = await authService.getCurrentUser();
    if (!user) {
        redirect("/login");
    }
    if (!hasRoleAtLeast(user.role, minimumRole)) {
        redirect("/");
    }
    return user;
}
