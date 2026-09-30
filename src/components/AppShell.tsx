"use client";

import { useState } from "react";
import Breadcrumbs from "./Breadcrumbs";
import { DRAWER_TOGGLE_ID } from "./DrawerConstants";
import Icon from "./Icon";
import ProfileMenu from "./ProfileMenu";
import SideMenu from "./SideMenu";

interface IAppShellProps {
    children: React.ReactNode;
}

/**
 * Page frame with a full-height side menu and a top bar.
 * On large screens the menu can be collapsed; on small screens it slides over the content.
 */
export default function AppShell({ children }: IAppShellProps) {
    const [isMenuCollapsed, setIsMenuCollapsed] = useState<boolean>(false);

    function toggleMenuCollapsed(): void {
        setIsMenuCollapsed(!isMenuCollapsed);
    }

    return (
        <div className={`drawer min-h-screen ${isMenuCollapsed ? "" : "lg:drawer-open"}`}>
            <input id={DRAWER_TOGGLE_ID} type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex min-h-screen flex-col">
                <div className="navbar bg-base-100 px-4 shadow-sm">
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

                    <div className="flex items-center gap-3">
                        <ProfileMenu />
                    </div>
                </div>
                <div className="flex flex-1 flex-col">{children}</div>
            </div>
            <div className="drawer-side">
                <label htmlFor={DRAWER_TOGGLE_ID} className="drawer-overlay" aria-label="Close menu"></label>
                <SideMenu />
            </div>
        </div>
    );
}
