"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";
import { DRAWER_TOGGLE_ID } from "./DrawerConstants";
import Icon from "./Icon";
import ProfileMenu from "./ProfileMenu";
import SideMenu from "./SideMenu";

type Theme = "brand" | "brand-light";

const PRINT_PAGE_PATH = /^\/employees\/[^/]+\/print$/;

/** The profile page keeps the frame still and scrolls only the template, so it gets a frame exactly one screen tall. */
const PROFILE_PAGE_PATH = /^\/employees\/[^/]+$/;

interface IAppShellProps {
    children: React.ReactNode;
}

/**
 * Page frame with a full-height side menu and a top bar.
 * On large screens the menu can be collapsed; on small screens it slides over the content.
 * The top bar includes a light/dark mode toggle; the page, top bar and sidebar all follow the chosen theme.
 */
export default function AppShell({ children }: IAppShellProps) {
    const pathname: string = usePathname();
    const [isMenuCollapsed, setIsMenuCollapsed] = useState<boolean>(false);
    const [theme, setTheme] = useState<Theme>("brand-light");

    useEffect(() => {
        const saved = localStorage.getItem("gtkm-theme") as Theme | null;
        if (saved === "brand") {
            setTheme("brand");
        }
    }, []);

    function toggleTheme(): void {
        const next: Theme = theme === "brand-light" ? "brand" : "brand-light";
        setTheme(next);
        document.documentElement.dataset.theme = next;
        localStorage.setItem("gtkm-theme", next);
    }

    function toggleMenuCollapsed(): void {
        setIsMenuCollapsed(!isMenuCollapsed);
    }

    if (pathname.startsWith("/invite/") || PRINT_PAGE_PATH.test(pathname)) {
        return <>{children}</>;
    }

    const isScreenHeight: boolean = PROFILE_PAGE_PATH.test(pathname);

    return (
        <div className={`drawer min-h-screen ${isMenuCollapsed ? "" : "lg:drawer-open"}`}>
            <input id={DRAWER_TOGGLE_ID} type="checkbox" className="drawer-toggle" />
            <div
                className={`drawer-content flex flex-col ${isScreenHeight ? "h-dvh overflow-hidden" : "min-h-screen"}`}
            >
                <div className="navbar bg-base-100 border-b border-base-300 px-4">
                    <label
                        htmlFor={DRAWER_TOGGLE_ID}
                        className="btn btn-square btn-ghost lg:hidden"
                        aria-label="Open menu"
                    >
                        <Icon name="menu" />
                    </label>
                    <button
                        type="button"
                        className="btn btn-square btn-ghost hidden lg:inline-flex"
                        aria-label={isMenuCollapsed ? "Expand menu" : "Collapse menu"}
                        aria-expanded={!isMenuCollapsed}
                        onClick={toggleMenuCollapsed}
                    >
                        <Icon name="menu" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <Breadcrumbs />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="btn btn-square btn-ghost"
                            aria-label={theme === "brand-light" ? "Switch to dark mode" : "Switch to light mode"}
                            onClick={toggleTheme}
                        >
                            <Icon name={theme === "brand-light" ? "dark_mode" : "light_mode"} />
                        </button>
                        <ProfileMenu />
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </div>
            <div className="drawer-side">
                <label htmlFor={DRAWER_TOGGLE_ID} className="drawer-overlay" aria-label="Close menu"></label>
                <SideMenu />
            </div>
        </div>
    );
}
