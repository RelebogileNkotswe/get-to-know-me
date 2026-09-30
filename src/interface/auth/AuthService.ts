import type { UserRole } from "../../models/UserRole";

/** Contract for signing users in and out and for reading who is signed in. */
export interface IAuthService {
    /** Signs the current user out. */
    logOut(): void;

    /** Returns the role of the signed-in user. */
    getCurrentRole(): UserRole;
}
