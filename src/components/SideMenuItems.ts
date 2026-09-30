import type { UserRole } from "../models/UserRole";

/** A single navigation link in the side menu, visible from a minimum role upwards. */
export interface ISideMenuLink {
    label: string;
    href: string;
    /** Material Symbols icon name. */
    icon: string;
    minimumRole: UserRole;
}

/** Links at the top of the side menu, in display order. */
export const mainLinks: ISideMenuLink[] = [
    { label: "Employees", href: "/", icon: "groups", minimumRole: "viewer" },
    { label: "Create/edit profile", href: "/editor", icon: "person_edit", minimumRole: "editor" },
    { label: "Admin", href: "/admin", icon: "admin_panel_settings", minimumRole: "admin" },
];

/** Link to the signed-in user's own profile page, shown at the bottom of the side menu. */
export const profileLink: ISideMenuLink = { label: "Profile", href: "/profile", icon: "person", minimumRole: "viewer" };
