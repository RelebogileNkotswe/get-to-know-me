import type { IProfileFormValues } from "../../models/ProfileForm";
import { ClientUtils } from "../../utils/ClientUtils";

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
