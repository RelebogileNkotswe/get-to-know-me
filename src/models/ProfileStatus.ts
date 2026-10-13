/** Where a profile is in its life: invited, submitted by the employee and waiting for review, or live in the directory. */
export type ProfileStatus = "invited" | "awaiting_review" | "published";

/** Text shown for each status. */
export const profileStatusLabels: Record<ProfileStatus, string> = {
    invited: "Invited",
    awaiting_review: "Awaiting review",
    published: "Published",
};
