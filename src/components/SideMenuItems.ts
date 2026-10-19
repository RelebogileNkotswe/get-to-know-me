import { UserRole } from "../models/UserRole";

/** Group a menu link belongs to; each group has its own small heading in the menu. */
export type SideMenuSection = "main" | "editor" | "admin";

/** A single navigation link in the side menu, visible from a minimum role upwards. */
export interface ISideMenuLink {
    label: string;
    href: string;
    /** Material Symbols icon name. */
    icon: string;
    minimumRole: UserRole;
    section: SideMenuSection;
    /** Show how many submitted profiles are waiting for review next to this link. */
    showsReviewCount?: boolean;
}

/** Heading shown above each group of links. */
export const sectionLabels: Record<SideMenuSection, string> = {
    main: "Main",
    editor: "Editor actions",
    admin: "Admin tools",
};

/** Groups in display order. */
export const sectionOrder: SideMenuSection[] = ["main", "editor", "admin"];

/** Links at the top of the side menu, in display order. */
export const mainLinks: ISideMenuLink[] = [
    { label: "Employees", href: "/", icon: "groups", minimumRole: UserRole.Viewer, section: "main" },
    {
        label: "Create/edit profile",
        href: "/editor",
        icon: "person_edit",
        minimumRole: UserRole.Editor,
        section: "editor",
    },
    {
        label: "Invites and review",
        href: "/editor/invites",
        icon: "forward_to_inbox",
        minimumRole: UserRole.Editor,
        section: "editor",
        showsReviewCount: true,
    },
    {
        label: "Users and roles",
        href: "/admin",
        icon: "admin_panel_settings",
        minimumRole: UserRole.Admin,
        section: "admin",
    },
    { label: "Audit log", href: "/admin/audit", icon: "history", minimumRole: UserRole.Admin, section: "admin" },
];

/** Link to the signed-in user's own profile page, shown at the bottom of the side menu. */
export const profileLink: ISideMenuLink = {
    label: "Profile",
    href: "/profile",
    icon: "person",
    minimumRole: UserRole.Viewer,
    section: "main",
};
