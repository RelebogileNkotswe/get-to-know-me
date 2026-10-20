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
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            {trail.map((crumb: IBreadcrumb, i: number) => (
                <span key={crumb.label} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-base-content/20">/</span>}
                    {crumb.href ? (
                        <Link href={crumb.href} className="text-base-content/50 hover:text-base-content transition-colors">
                            {crumb.label}
                        </Link>
                    ) : (
                        <span aria-current="page" className="font-semibold text-base-content">
                            {crumb.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
