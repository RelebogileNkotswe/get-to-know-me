/** One step in a breadcrumb trail. The last step has no href because it is the current page. */
export interface IBreadcrumb {
    label: string;
    href?: string;
}

const home: IBreadcrumb = { label: "Home", href: "/" };
const editor: IBreadcrumb = { label: "Create/edit profile", href: "/editor" };

/**
 * Returns the breadcrumb trail for a route. Add an entry here for every new page.
 * Unknown routes (such as the not-found page) show only Home.
 */
export function getBreadcrumbs(pathname: string): IBreadcrumb[] {
    if (pathname === "/") {
        return [{ label: "Home" }];
    }
    if (pathname === "/editor") {
        return [home, { label: "Create/edit profile" }];
    }
    if (pathname === "/editor/profiles/new") {
        return [home, editor, { label: "Create profile" }];
    }
    if (/^\/editor\/profiles\/[^/]+\/edit$/.test(pathname)) {
        return [home, editor, { label: "Edit profile" }];
    }
    if (pathname === "/admin") {
        return [home, { label: "Admin" }];
    }
    if (pathname === "/profile") {
        return [home, { label: "Profile" }];
    }
    return [home];
}
