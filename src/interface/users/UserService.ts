import type { IUserAccount } from "../../models/UserAccount";
import type { UserRole } from "../../models/UserRole";

/** Outcome of an admin action on a user account. */
export type UserActionResult = { ok: true } | { ok: false; error: string };

/** Contract for the admin's view of user accounts. Server-side only; callers must already have checked the admin role. */
export interface IUserService {
    /** Returns every user account with the name from their profile (when they have one), role and lock status. */
    listUsers(): Promise<IUserAccount[]>;

    /**
     * Sets a user's role. Refuses to change the actor's own role and to remove the last admin.
     * The change applies on the user's next request, because the role is read from the database each time.
     */
    changeRole(actorUserId: string, targetUserId: string, role: UserRole): Promise<UserActionResult>;

    /** Unlocks a locked account and resets its failed sign-in attempts. */
    unlockUser(userId: string): Promise<UserActionResult>;
}
