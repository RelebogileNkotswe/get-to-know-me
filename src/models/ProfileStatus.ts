/**
 * Where a profile is in its life: invited, submitted by the employee and waiting for review, or live in the directory.
 * The values match the database's `ProfileStatus` enum.
 */
export enum ProfileStatus {
    Invited = "invited",
    AwaitingReview = "awaiting_review",
    Published = "published",
}

/** Text shown for each status. */
export const profileStatusLabels: Record<ProfileStatus, string> = {
    [ProfileStatus.Invited]: "Invited",
    [ProfileStatus.AwaitingReview]: "Awaiting review",
    [ProfileStatus.Published]: "Published",
};
