import type { IEditorAccount } from "../../models/EditorAccount";
import type { IEmployee } from "../../models/Employee";
import type { IProfileFormValues } from "../../models/ProfileForm";

/** Whether a person has a user account and, if so, whether it is locked. */
export interface IAccountStatus {
    hasAccount: boolean;
    isLocked: boolean;
}

/** Contract for reading Get To Know Me profiles and the accounts linked to them. */
export interface IProfileService {
    /** Returns the saved profile, or null when no profile has this id. */
    getProfile(profileId: string): Promise<IProfileFormValues | null>;

    /** Returns the status of the user account linked to the profile by email. */
    getAccountStatus(profileId: string): Promise<IAccountStatus>;

    /** Returns everyone with a profile, a user account, or both, for the editor list. */
    listEditorAccounts(): Promise<IEditorAccount[]>;

    /** Returns the published profiles shown in the employee list. */
    listPublishedEmployees(): Promise<IEmployee[]>;
}
