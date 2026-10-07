/** An employee shown in the employee list. */
export interface IEmployee {
    id: string;
    name: string;
    position: string;
    /** ISO date, e.g. 2026-09-14. */
    startDate: string;
    /** "Beyond the office gates" text, shown as a short snippet on the card; empty when not entered. */
    hobbies: string;
    /** True when a user account is linked to this profile by email. */
    hasAccount: boolean;
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
