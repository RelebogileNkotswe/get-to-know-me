/** An employee shown in the employee list. */
export interface IEmployee {
    id: string;
    name: string;
    position: string;
    /** ISO date, e.g. 2026-09-14. */
    startDate: string;
    /** What to call them; empty when not entered. */
    preferredName: string;
    /** "Beyond the office gates" text, shown as a short snippet on the card; empty when not entered. */
    hobbies: string;
    /** "Beyond the bio" text; empty when not entered. Searchable. */
    somethingInteresting: string;
    /** "Educational & professional background" text; empty when not entered. Searchable. */
    background: string;
    /** True when a user account is linked to this profile by email. */
    hasAccount: boolean;
    /** True when they started in the last 30 days, so they appear in the new starter carousel. */
    isNewStarter: boolean;
}

/** How many days after starting someone still counts as a new starter. */
export const NEW_STARTER_DAYS = 30;

/**
 * True when the start date is today or up to 30 days ago. Someone whose start date is still in the future is not shown yet.
 * Dates are ISO strings such as 2026-09-14, so they compare correctly as text.
 */
export function isNewStarter(startDate: string, today: Date): boolean {
    if (startDate === "") {
        return false;
    }
    const todayIso: string = today.toISOString().slice(0, 10);
    const earliest: Date = new Date(`${todayIso}T00:00:00Z`);
    earliest.setUTCDate(earliest.getUTCDate() - NEW_STARTER_DAYS);
    return startDate <= todayIso && startDate >= earliest.toISOString().slice(0, 10);
}

/** True when the search text appears in the name, position or any of the three profile text sections. */
export function matchesEmployeeSearch(employee: IEmployee, searchText: string): boolean {
    if (searchText === "") {
        return true;
    }
    return [
        employee.name,
        employee.position,
        employee.hobbies,
        employee.somethingInteresting,
        employee.background,
    ].some((value: string) => value.toLowerCase().includes(searchText));
}

/** Up to two initials of a name, shown in place of a photo. */
export function getInitials(name: string): string {
    const parts: string[] = name.trim().split(/\s+/).filter((part: string) => part !== "");
    return parts
        .slice(0, 2)
        .map((part: string) => part.charAt(0).toUpperCase())
        .join("");
}

/** How the employee list is displayed. */
export type EmployeeView = "list" | "card";
