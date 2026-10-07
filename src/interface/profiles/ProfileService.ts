import type { IEditorAccount } from "../../models/EditorAccount";
import type { IEmployee } from "../../models/Employee";
import type { IProfileFormValues, ProfileFormErrors } from "../../models/ProfileForm";

/** Outcome of creating or updating a profile: the saved profile's id, or an error message for each invalid field. */
export type SaveProfileResult = { ok: true; profileId: string } | { ok: false; errors: ProfileFormErrors };

/** Whether a person has a user account and, if so, whether it is locked. */
export interface IAccountStatus {
    hasAccount: boolean;
    isLocked: boolean;
}

/** Contract for reading Get To Know Me profiles and the accounts linked to them. */
export interface IProfileService {
    /** Returns the saved profile, or null when no profile has this id. */
    getProfile(profileId: string): Promise<IProfileFormValues | null>;

    /** Returns the profile only when it is published, or null otherwise. Used by the profile view every user can open. */
    getPublishedProfile(profileId: string): Promise<IProfileFormValues | null>;

    /** Returns the status of the user account linked to the profile by email. */
    getAccountStatus(profileId: string): Promise<IAccountStatus>;

    /** Returns everyone with a profile, a user account, or both, for the editor list. */
    listEditorAccounts(): Promise<IEditorAccount[]>;

    /** Returns the published profiles shown in the employee list. */
    listPublishedEmployees(): Promise<IEmployee[]>;

    /**
     * Validates and saves a new profile, published straight away. Fails with an error on the field when the
     * values are invalid or the company email already has a profile.
     */
    createProfile(values: IProfileFormValues): Promise<SaveProfileResult>;

    /** Validates and saves changes to a profile. Fails with the same errors as `createProfile`, or an error on the email when the profile no longer exists. */
    updateProfile(profileId: string, values: IProfileFormValues): Promise<SaveProfileResult>;

    /** Deletes the profile. Returns false when no profile has this id. The linked user account is kept. */
    deleteProfile(profileId: string): Promise<boolean>;
}
