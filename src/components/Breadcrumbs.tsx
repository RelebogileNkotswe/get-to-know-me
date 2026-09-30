"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbs, type IBreadcrumb } from "./BreadcrumbTrails";

/**
 * Breadcrumb trail for the current page, shown in the navbar.
 */
export default function Breadcrumbs() {
    const pathname: string = usePathname();
    const trail: IBreadcrumb[] = getBreadcrumbs(pathname);

    return (
        <div className="breadcrumbs text-sm" aria-label="Breadcrumb">
            <ul>
                {trail.map((crumb: IBreadcrumb) => (
                    <li key={crumb.label}>
                        {crumb.href ? (
                            <Link href={crumb.href}>{crumb.label}</Link>
                        ) : (
                            <span aria-current="page" className="font-semibold">
                                {crumb.label}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
