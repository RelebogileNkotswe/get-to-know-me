import type { UserRole } from "./UserRole";

/** The signed-in user, as read from their session. */
export interface ICurrentUser {
    id: string;
    email: string;
    role: UserRole;
}
