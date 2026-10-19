/** Roles a signed-in user can hold, from least to most privileged. The values match the database's `UserRole` enum. */
export enum UserRole {
    Viewer = "viewer",
    Editor = "editor",
    Admin = "admin",
}

const roleRanks: Record<UserRole, number> = {
    [UserRole.Viewer]: 0,
    [UserRole.Editor]: 1,
    [UserRole.Admin]: 2,
};

/**
 * Returns true when the role is at least as privileged as the minimum role.
 * Admins can do everything editors can, and editors everything viewers can.
 */
export function hasRoleAtLeast(role: UserRole, minimumRole: UserRole): boolean {
    return roleRanks[role] >= roleRanks[minimumRole];
}
