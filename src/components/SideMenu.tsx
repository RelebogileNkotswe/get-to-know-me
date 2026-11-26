"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../app/login/actions";
import { roleLabels } from "../models/UserAccount";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";
import { useCurrentUser } from "./CurrentUserProvider";
import { DRAWER_TOGGLE_ID } from "./DrawerConstants";
import Icon from "./Icon";
import { mainLinks, profileLink, sectionLabels, sectionOrder, type ISideMenuLink } from "./SideMenuItems";

const linkBase: string =
    "flex items-center gap-3 rounded-field px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const linkIdle: string = "text-base-content/75 hover:bg-base-300 hover:text-base-content";
const linkActive: string = "bg-primary text-primary-content";

/**
 * Side navigation menu shown inside the root layout's drawer: the brand, links grouped under small headings, and the
 * signed-in user at the bottom. Shows each role only its own entries and highlights the entry matching the current route.
 */
export default function SideMenu() {
    const pathname: string = usePathname();
    const user = useCurrentUser();
    const currentRole: UserRole = user?.role ?? UserRole.Viewer;
    const reviewCount: number = user?.awaitingReviewCount ?? 0;

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
                    {item.showsReviewCount && reviewCount > 0 && (
                        <span
                            className="bg-primary text-primary-content ml-auto rounded-selector px-2 py-0.5 text-xs font-bold"
                            aria-label={`${reviewCount} waiting for review`}
                        >
                            {reviewCount}
                        </span>
                    )}
                </Link>
            </li>
        );
    }

    return (
        <nav
            className="bg-base-200 text-base-content border-base-300 flex min-h-screen w-64 flex-col gap-6 border-r p-4"
            aria-label="Main navigation"
        >
            <div className="border-primary border-l-4 px-3 py-1">
                <p className="font-headline text-lg leading-tight font-bold">Singular</p>
                <p className="font-headline text-base-content/70 text-xs font-semibold tracking-widest uppercase">
                    Get to know me
                </p>
            </div>

            <div className="flex flex-col gap-5">
                {sectionOrder.map((section) => {
                    const links: ISideMenuLink[] = visibleLinks.filter(
                        (item: ISideMenuLink) => item.section === section,
                    );
                    if (links.length === 0) {
                        return null;
                    }
                    return (
                        <div key={section}>
                            <p className="text-base-content/60 px-3 pb-2 text-xs font-semibold tracking-wider uppercase">
                                {sectionLabels[section]}
                            </p>
                            <ul className="flex flex-col gap-1">{links.map(renderLink)}</ul>
                        </div>
                    );
                })}
            </div>

            <div className="border-base-300 mt-auto flex flex-col gap-2 border-t pt-4">
                {user && (
                    <div className="flex items-center gap-3 px-3 pb-2">
                        <div
                            className="bg-primary text-primary-content flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            aria-hidden="true"
                        >
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold" title={user.email}>
                                {user.email}
                            </p>
                            <p className="text-base-content/70 text-xs">{roleLabels[user.role]}</p>
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
