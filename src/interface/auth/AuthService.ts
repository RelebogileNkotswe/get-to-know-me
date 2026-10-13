import type { ICurrentUser } from "../../models/CurrentUser";

/** Outcome of a sign-in attempt. The error is the same for every failure, so it does not reveal which emails have accounts. */
export type SignInResult = { ok: true } | { ok: false; error: string };

/** Outcome of changing a password: an error message for each invalid field. */
export type ChangePasswordResult =
    | { ok: true }
    | { ok: false; errors: { currentPassword?: string; newPassword?: string } };

/** Contract for signing users in and out and for reading who is signed in. Server-side only. */
export interface IAuthService {
    /** Checks the email and password, and on success starts a session (sets the session cookie). */
    signIn(email: string, password: string): Promise<SignInResult>;

    /** Ends the current session and clears the session cookie. */
    signOut(): Promise<void>;

    /**
     * Changes the signed-in user's own password after checking the current one. A wrong current password counts as a
     * failed sign-in attempt, so it cannot be guessed from a stolen session. Other sessions are signed out.
     */
    changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResult>;

    /** Returns the signed-in user, or null when there is no valid session. */
    getCurrentUser(): Promise<ICurrentUser | null>;
}
