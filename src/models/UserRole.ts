/** Roles a signed-in user can hold, from least to most privileged. */
export type UserRole = "viewer" | "editor" | "admin";

const roleRanks: Record<UserRole, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
};

/**
 * Returns true when the role is at least as privileged as the minimum role.
 * Admins can do everything editors can, and editors everything viewers can.
 */
export function hasRoleAtLeast(role: UserRole, minimumRole: UserRole): boolean {
    return roleRanks[role] >= roleRanks[minimumRole];
}
