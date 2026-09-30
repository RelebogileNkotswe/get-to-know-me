import type { UserRole } from "./UserRole";

/** A user account as managed by admins. */
export interface IUserAccount {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isLocked: boolean;
    /** ISO date of the last sign-in, e.g. 2026-09-14; null when the user has never signed in. */
    lastSignIn: string | null;
}

/** Role choices in the admin filter. */
export type RoleFilter = "all" | UserRole;

/** Lock status choices in the admin filter. */
export type LockStatusFilter = "all" | "active" | "locked";

/** Text shown for each role choice. */
export const roleFilterLabels: Record<RoleFilter, string> = {
    all: "All roles",
    viewer: "Viewers",
    editor: "Editors",
    admin: "Admins",
};

/** Text shown for each lock status choice. */
export const lockStatusFilterLabels: Record<LockStatusFilter, string> = {
    all: "All statuses",
    active: "Active",
    locked: "Locked",
};

/** Text shown for a single user's role. */
export const roleLabels: Record<UserRole, string> = {
    viewer: "Viewer",
    editor: "Editor",
    admin: "Admin",
};
