"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "../logic/auth/AuthService";
import { hasRoleAtLeast, type UserRole } from "../models/UserRole";
import { DRAWER_TOGGLE_ID } from "./DrawerConstants";
import Icon from "./Icon";
import { mainLinks, profileLink, type ISideMenuLink } from "./SideMenuItems";

/**
 * Side navigation menu shown inside the root layout's drawer.
 * Shows each role only its own entries and highlights the entry matching the current route.
 */
export default function SideMenu() {
    const pathname: string = usePathname();
    const currentRole: UserRole = authService.getCurrentRole();

    function closeDrawer(): void {
        const toggle = document.getElementById(DRAWER_TOGGLE_ID) as HTMLInputElement | null;
        if (toggle) {
            toggle.checked = false;
        }
    }

    function logOut(): void {
        authService.logOut();
        closeDrawer();
    }

    const visibleMainLinks: ISideMenuLink[] = mainLinks.filter((item: ISideMenuLink) =>
        hasRoleAtLeast(currentRole, item.minimumRole),
    );

    function matchesRoute(href: string): boolean {
        return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    }

    // The most specific matching link is highlighted, so /editor/profiles/new lights up "Create profile" and not "Editor".
    const activeHref: string | undefined = [...visibleMainLinks, profileLink]
        .filter((item: ISideMenuLink) => matchesRoute(item.href))
        .map((item: ISideMenuLink) => item.href)
        .sort((a: string, b: string) => b.length - a.length)[0];

    function renderLink(item: ISideMenuLink) {
        return (
            <li key={item.href}>
                <Link href={item.href} className={item.href === activeHref ? "menu-active" : ""} onClick={closeDrawer}>
                    <Icon name={item.icon} />
                    {item.label}
                </Link>
            </li>
        );
    }

    return (
        <ul className="menu bg-primary text-primary-content min-h-screen w-64 flex-nowrap p-4">
            <li className="menu-title">Get To Know Me</li>
            {visibleMainLinks.map(renderLink)}
            <li className="mt-auto"></li>
            {renderLink(profileLink)}
            <li>
                <button type="button" onClick={logOut}>
                    <Icon name="logout" />
                    Log out
                </button>
            </li>
        </ul>
    );
}
