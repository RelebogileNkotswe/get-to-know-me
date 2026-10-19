import "server-only";
import { redirect } from "next/navigation";
import type { ICurrentUser } from "../../models/CurrentUser";
import { hasRoleAtLeast, UserRole } from "../../models/UserRole";
import { authService } from "./AuthService";

/**
 * The signed-in user when they have at least this role, otherwise null. For server actions, which answer with a result
 * instead of redirecting, and which need the user to record who made a change.
 */
export async function currentUserWithRole(minimumRole: UserRole): Promise<ICurrentUser | null> {
    const user: ICurrentUser | null = await authService.getCurrentUser();
    return user !== null && hasRoleAtLeast(user.role, minimumRole) ? user : null;
}

/**
 * Returns the signed-in user, sending anyone else to the login page. Every page calls this, because the proxy only checks that a
 * session cookie exists. A signed-in user without the minimum role is sent back to the employee list.
 */
export async function requireUser(minimumRole: UserRole = UserRole.Viewer): Promise<ICurrentUser> {
    const user: ICurrentUser | null = await authService.getCurrentUser();
    if (!user) {
        redirect("/login");
    }
    if (!hasRoleAtLeast(user.role, minimumRole)) {
        redirect("/");
    }
    return user;
}
