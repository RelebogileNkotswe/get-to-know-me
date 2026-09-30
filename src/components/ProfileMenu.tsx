"use client";

import Image from "next/image";
import Link from "next/link";
import { authService } from "../logic/auth/AuthService";
import Icon from "./Icon";

/**
 * Circular, bordered profile picture that opens a dropdown with Profile and Log out.
 */
export default function ProfileMenu() {
    function closeDropdown(): void {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    function logOut(): void {
        authService.logOut();
        closeDropdown();
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-circle btn-ghost avatar" aria-label="Open profile menu">
                <div className="ring-primary ring-offset-base-100 w-10 rounded-full ring-2 ring-offset-2">
                    <Image src="/avatar-placeholder.svg" alt="Profile picture" width={40} height={40} unoptimized />
                </div>
            </div>
            <ul tabIndex={-1} className="menu dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow-sm">
                <li>
                    <Link href="/profile" onClick={closeDropdown}>
                        <Icon name="person" />
                        Profile
                    </Link>
                </li>
                <li>
                    <button type="button" onClick={logOut}>
                        <Icon name="logout" />
                        Log out
                    </button>
                </li>
            </ul>
        </div>
    );
}
