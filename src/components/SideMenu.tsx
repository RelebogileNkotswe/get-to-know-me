"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../app/login/actions";
import { roleLabels } from "../models/UserAccount";
import { hasRoleAtLeast, type UserRole } from "../models/UserRole";
import { useCurrentUser } from "./CurrentUserProvider";
import { DRAWER_TOGGLE_ID } from "./DrawerConstants";
import Icon from "./Icon";
import { mainLinks, profileLink, sectionLabels, sectionOrder, type ISideMenuLink } from "./SideMenuItems";

const linkBase: string =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green";
const linkIdle: string = "text-white/75 hover:bg-white/10 hover:text-white";
const linkActive: string = "bg-brand-green text-brand-navy";

/**
 * Side navigation menu shown inside the root layout's drawer: the brand, links grouped under small headings, and the
 * signed-in user at the bottom. Shows each role only its own entries and highlights the entry matching the current route.
 */
export default function SideMenu() {
    const pathname: string = usePathname();
    const user = useCurrentUser();
    const currentRole: UserRole = user?.role ?? "viewer";

    function closeDrawer(): void {
        const toggle = document.getElementById(DRAWER_TOGGLE_ID) as HTMLInputElement | null;
        if (toggle) {
            toggle.checked = false;
        }
    }

    const visibleLinks: ISideMenuLink[] = mainLinks.filter((item: ISideMenuLink) =>
        hasRoleAtLeast(currentRole, item.minimumRole),
    );

    function matchesRoute(href: string): boolean {
        return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    }

    // The most specific matching link is highlighted, so /editor/profiles/new lights up "Create/edit profile" and not "Employees".
    const activeHref: string | undefined = [...visibleLinks, profileLink]
        .filter((item: ISideMenuLink) => matchesRoute(item.href))
        .map((item: ISideMenuLink) => item.href)
        .sort((a: string, b: string) => b.length - a.length)[0];

    function renderLink(item: ISideMenuLink) {
        const isActive: boolean = item.href === activeHref;
        return (
            <li key={item.href}>
                <Link
                    href={item.href}
                    className={`${linkBase} ${isActive ? linkActive : linkIdle}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={closeDrawer}
                >
                    <Icon name={item.icon} />
                    {item.label}
                </Link>
            </li>
        );
    }

    return (
        <nav
            className="bg-brand-navy flex min-h-screen w-64 flex-col gap-6 p-4 text-white"
            aria-label="Main navigation"
        >
            <div className="px-3 pt-2">
                <p className="text-lg leading-tight font-bold">Singular</p>
                <p className="text-brand-green text-xs font-semibold tracking-widest uppercase">Get to know me</p>
            </div>

            <div className="flex flex-col gap-5">
                {sectionOrder.map((section) => {
                    const links: ISideMenuLink[] = visibleLinks.filter((item: ISideMenuLink) => item.section === section);
                    if (links.length === 0) {
                        return null;
                    }
                    return (
                        <div key={section}>
                            <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-white/45 uppercase">
                                {sectionLabels[section]}
                            </p>
                            <ul className="flex flex-col gap-1">{links.map(renderLink)}</ul>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
                {user && (
                    <div className="flex items-center gap-3 px-3 pb-2">
                        <div
                            className="bg-brand-green text-brand-navy flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            aria-hidden="true"
                        >
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold" title={user.email}>
                                {user.email}
                            </p>
                            <p className="text-brand-green text-xs">{roleLabels[user.role]}</p>
                        </div>
                    </div>
                )}
                <ul className="flex flex-col gap-1">
                    {renderLink(profileLink)}
                    <li>
                        <form action={signOutAction}>
                            <button type="submit" className={`${linkBase} ${linkIdle} w-full text-left`}>
                                <Icon name="logout" />
                                Log out
                            </button>
                        </form>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
