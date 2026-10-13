import "server-only";
import { redirect } from "next/navigation";
import type { ICurrentUser } from "../../models/CurrentUser";
import { hasRoleAtLeast, type UserRole } from "../../models/UserRole";
import { authService } from "./AuthService";

/** True when someone is signed in with at least this role. For server actions, which answer with a result instead of redirecting. */
export async function currentUserHasRole(minimumRole: UserRole): Promise<boolean> {
    const user: ICurrentUser | null = await authService.getCurrentUser();
    return user !== null && hasRoleAtLeast(user.role, minimumRole);
}

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
