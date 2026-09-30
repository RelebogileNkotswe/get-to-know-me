/** A person known to the tool: they may have a Get To Know Me profile, a linked user account, or both. */
export interface IEditorAccount {
    /** Profile id when the person has a profile, otherwise the user account id. */
    id: string;
    name: string;
    email: string;
    position: string | null;
    /** ISO date, e.g. 2026-09-14; null when the person has no profile. */
    startDate: string | null;
    /** True when a Get To Know Me profile exists for this person. */
    hasProfile: boolean;
    /** True when the person has a user account linked to their profile email. */
    hasAccount: boolean;
}

/** Account status choices in the editor filter. */
export type AccountStatusFilter = "all" | "not-linked" | "no-profile";

/** Text shown for each account status choice. */
export const accountStatusLabels: Record<AccountStatusFilter, string> = {
    all: "All",
    "not-linked": "Not linked (profile, no account)",
    "no-profile": "No profile (account, no profile)",
};

/** Returns true when the account matches the chosen account status. */
export function matchesAccountStatus(account: IEditorAccount, status: AccountStatusFilter): boolean {
    switch (status) {
        case "not-linked":
            return account.hasProfile && !account.hasAccount;
        case "no-profile":
            return account.hasAccount && !account.hasProfile;
        default:
            return true;
    }
}
