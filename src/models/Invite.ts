import type { ProfileStatus } from "./ProfileStatus";

/** How many days an invite link works before it has to be replaced. TODO: the spec leaves this open; 14 days is a placeholder. */
export const INVITE_VALID_DAYS = 14;

/** A profile that has been invited or submitted, shown to editors and admins on the invites page. */
export interface IPendingInvite {
    profileId: string;
    name: string;
    email: string;
    position: string | null;
    /** "invited" (link sent, nothing submitted yet) or "awaiting_review" (submitted, waiting for review). */
    status: Exclude<ProfileStatus, ProfileStatus.Published>;
    /** ISO date the link stops working. */
    expiresOn: string;
    isExpired: boolean;
    /** ISO date the employee submitted the form; null while still invited. */
    submittedOn: string | null;
}

/** Path of the page a new joiner opens. The full address is this path on the site's own address. */
export function inviteLinkPath(token: string): string {
    return `/invite/${token}`;
}
