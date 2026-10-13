import type { IProfileFormValues } from "../../models/ProfileForm";

/** Profile ids come from URLs; anything that is not a UUID cannot match and would make Postgres reject the query. */
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trimmed text, or null when nothing was entered (the database stores "not entered" as null). */
export function toNullable(value: string): string | null {
    const trimmed: string = value.trim();
    return trimmed === "" ? null : trimmed;
}

/** Form values as database columns: the email is trimmed and lowercased, empty fields become null. */
export function toDatabaseData(values: IProfileFormValues) {
    return {
        companyEmail: values.companyEmail.trim().toLowerCase(),
        firstName: toNullable(values.firstName),
        lastName: toNullable(values.lastName),
        preferredName: toNullable(values.preferredName),
        position: toNullable(values.position),
        startDate: values.startDate === "" ? null : new Date(`${values.startDate}T00:00:00Z`),
        linkedIn: toNullable(values.linkedIn),
        hobbies: toNullable(values.hobbies),
        somethingInteresting: toNullable(values.somethingInteresting),
        background: toNullable(values.background),
    };
}

/** True when a Prisma error has this code (P2002: unique value already used, P2025: record not found). */
export function hasPrismaCode(error: unknown, code: string): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
