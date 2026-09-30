/** Formats a date as a local ISO date string, e.g. 2026-09-14. */
export function toIsoDate(date: Date): string {
    const month: string = String(date.getMonth() + 1).padStart(2, "0");
    const day: string = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses an ISO date string (e.g. 2026-09-14) as a local date; returns undefined for an empty string. */
export function fromIsoDate(isoDate: string): Date | undefined {
    if (isoDate === "") {
        return undefined;
    }
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
}
