import type { IProfileFormValues } from "../../models/ProfileForm";
import type { Profile } from "../../prisma/generated/client";
import { ClientUtils } from "../../utils/ClientUtils";

/** A profile's form values as database columns. */
export type ProfileDatabaseData = ReturnType<typeof toDatabaseData>;

/** Form values as database columns: the email is trimmed and lowercased, empty fields become null. */
export function toDatabaseData(values: IProfileFormValues) {
    return {
        companyEmail: values.companyEmail.trim().toLowerCase(),
        firstName: ClientUtils.toNullable(values.firstName),
        lastName: ClientUtils.toNullable(values.lastName),
        preferredName: ClientUtils.toNullable(values.preferredName),
        position: ClientUtils.toNullable(values.position),
        startDate: values.startDate === "" ? null : ClientUtils.fromUtcIsoDate(values.startDate),
        linkedIn: ClientUtils.toNullable(values.linkedIn),
        hobbies: ClientUtils.toNullable(values.hobbies),
        somethingInteresting: ClientUtils.toNullable(values.somethingInteresting),
        background: ClientUtils.toNullable(values.background),
    };
}

/** The form fields whose saved value would change from the profile to the new data, for the audit log. */
export function changedProfileFields(profile: Profile, data: ProfileDatabaseData): (keyof IProfileFormValues)[] {
    const changed: (keyof IProfileFormValues)[] = [];
    for (const field of Object.keys(data) as (keyof ProfileDatabaseData)[]) {
        const before: string | Date | null = profile[field];
        const after: string | Date | null = data[field];
        const isSame: boolean =
            before instanceof Date && after instanceof Date ? before.getTime() === after.getTime() : before === after;
        if (!isSame) {
            changed.push(field);
        }
    }
    return changed;
}
