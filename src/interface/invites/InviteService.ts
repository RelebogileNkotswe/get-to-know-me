import type { AuditActor } from "../../models/Audit";
import type { IPendingInvite } from "../../models/Invite";
import type { IProfileFormValues, ProfileFormErrors } from "../../models/ProfileForm";

/** Outcome of creating an invite: the one-time token to build the link from, or an error on each invalid field. */
export type CreateInviteResult = { ok: true; profileId: string; token: string } | { ok: false; errors: ProfileFormErrors };

/** What a new joiner sees when they open their link. */
export type InviteLookup =
    | { state: "open"; values: IProfileFormValues }
    | { state: "submitted" }
    | { state: "expired" }
    | { state: "invalid" };

/** An invite whose link still works: the profile it fills in and that profile's company email. */
export interface IOpenInvite {
    profileId: string;
    companyEmail: string;
}

/** Outcome of a new joiner submitting their form. `linkProblem` is set when the link itself no longer works. */
export type SubmitInviteResult = { ok: true } | { ok: false; errors: ProfileFormErrors; linkProblem: string | null };

/**
 * Contract for inviting new joiners to fill in their own profile. Server-side only. The functions for editors assume the
 * caller has already checked the editor role; the two for the new joiner (`getInvite` and `submitInvite`) are public
 * and secured only by the private token in the link.
 */
export interface IInviteService {
    /**
     * Creates a profile in the "invited" state, pre-filled with what the editor already knows, and a private link
     * for it, and records it in the audit log. The email is entered by the editor because it links the profile to the
     * person's account.
     */
    createInvite(values: IProfileFormValues, actor: AuditActor): Promise<CreateInviteResult>;

    /**
     * Replaces the link of an invite that has not been submitted, so the old link stops working, and records it in the
     * audit log. Returns the new token, or null.
     */
    renewLink(profileId: string, actor: AuditActor): Promise<string | null>;

    /**
     * Cancels an invite that has not been submitted, deleting its empty profile, and records it in the audit log.
     * Returns false when there was nothing to cancel.
     */
    cancelInvite(profileId: string, actor: AuditActor): Promise<boolean>;

    /** Lists profiles that are invited or awaiting review, newest first. */
    listPendingInvites(): Promise<IPendingInvite[]>;

    /** Looks up an invite by the token in its link. Never reveals anything about a link that is not valid. */
    getInvite(token: string): Promise<InviteLookup>;

    /** Returns the profile an open invite belongs to, so the new joiner can add a photo to it; null when the link does not work. */
    findOpenInvite(token: string): Promise<IOpenInvite | null>;

    /**
     * Saves the new joiner's answers, moves the profile to "awaiting review" and records it in the audit log. The email
     * stays as the editor entered it, whatever the browser sends. After this the link no longer works.
     */
    submitInvite(token: string, values: IProfileFormValues): Promise<SubmitInviteResult>;
}
