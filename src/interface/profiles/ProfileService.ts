import type { IProfileFormValues } from "../../models/ProfileForm";

/** Whether a person has a user account and, if so, whether it is locked. */
export interface IAccountStatus {
    hasAccount: boolean;
    isLocked: boolean;
}

/** Contract for reading Get To Know Me profiles and the accounts linked to them. */
export interface IProfileService {
    /** Returns the saved profile for an account, or null when the account has no profile. */
    getProfile(accountId: string): IProfileFormValues | null;

    /** Returns the status of the user account linked to the profile. */
    getAccountStatus(accountId: string): IAccountStatus;
}
