import type { IEditorAccount, IEditorAccountFilter } from "../../models/EditorAccount";
import type { IEmployee, IEmployeeFilter } from "../../models/Employee";
import type { IPage } from "../../models/Paging";
import type { IProfileFormValues, ProfileFormErrors } from "../../models/ProfileForm";
import type { ProfileStatus } from "../../models/ProfileStatus";

/** Outcome of creating or updating a profile: the saved profile's id, or an error message for each invalid field. */
export type SaveProfileResult = { ok: true; profileId: string } | { ok: false; errors: ProfileFormErrors };

/** Whether a person has a user account and, if so, whether it is locked. */
export interface IAccountStatus {
    hasAccount: boolean;
    isLocked: boolean;
}

/** Whether a signed-in user has a profile, and if not, whether they have already asked for one. */
export interface IOwnProfileStatus {
    hasProfile: boolean;
    profileRequested: boolean;
}

/** Contract for reading Get To Know Me profiles and the accounts linked to them. */
export interface IProfileService {
    /** Returns whether a profile with this company email exists, and whether the account has asked for one. */
    getOwnProfileStatus(email: string): Promise<IOwnProfileStatus>;

    /**
     * Records that the signed-in user, who has no profile, asks for one. Editors see this in their list of accounts
     * without a profile. Does nothing for a user who already has a profile.
     */
    requestProfile(userId: string): Promise<void>;

    /** Returns the saved profile, or null when no profile has this id. */
    getProfile(profileId: string): Promise<IProfileFormValues | null>;

    /** Returns the profile only when it is published, or null otherwise. Used by the profile view every user can open. */
    getPublishedProfile(profileId: string): Promise<IProfileFormValues | null>;

    /** Returns the status of the user account linked to the profile by email. */
    getAccountStatus(profileId: string): Promise<IAccountStatus>;

    /**
     * Returns one page of everyone with a profile, a user account, or both, that matches the filter, for the editor list.
     * People with a profile come first (by name), then accounts without one (by email). Every word of the search must
     * appear (in any case) in the name, preferred name, email or position; people without a profile are matched on
     * their email only. A start date that is not a valid ISO date is ignored.
     */
    listEditorAccounts(filter: IEditorAccountFilter): Promise<IPage<IEditorAccount>>;

    /**
     * Returns one page of the published profiles that match the filter, for the employee list. Every word of the search
     * must appear (in any case) in the name, preferred name, position or one of the three profile text sections. A start
     * date that is not a valid ISO date is ignored.
     */
    listPublishedEmployees(filter: IEmployeeFilter): Promise<IPage<IEmployee>>;

    /**
     * Returns the published profiles of new starters for the carousel, filtered the same way as the employee list, so the
     * carousel only shows people who also match the list below it. The carousel is not paged; its page number and size
     * are ignored.
     */
    listNewStarters(filter: IEmployeeFilter): Promise<IEmployee[]>;

    /**
     * Validates and saves a new profile, published straight away. Fails with an error on the field when the
     * values are invalid or the company email already has a profile.
     */
    createProfile(values: IProfileFormValues): Promise<SaveProfileResult>;

    /** Validates and saves changes to a profile. Fails with the same errors as `createProfile`, or an error on the email when the profile no longer exists. */
    updateProfile(profileId: string, values: IProfileFormValues): Promise<SaveProfileResult>;

    /** Returns where the profile is in its life (invited, awaiting review or published), or null when it does not exist. */
    getProfileStatus(profileId: string): Promise<ProfileStatus | null>;

    /** Publishes a profile the employee has submitted, so it shows in the employee list. Returns false when it was not awaiting review. */
    publishProfile(profileId: string): Promise<boolean>;

    /** How many submitted profiles are waiting for an editor or admin to review them. */
    countAwaitingReview(): Promise<number>;

    /** Deletes the profile. Returns false when no profile has this id. The linked user account is kept. */
    deleteProfile(profileId: string): Promise<boolean>;
}
