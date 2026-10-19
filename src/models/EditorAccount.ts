import { ClientUtils, type SearchParams } from "../utils/ClientUtils";
import type { IPageRequest } from "./Paging";
import type { ProfileStatus } from "./ProfileStatus";

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
    /** True when the person has no profile and asked for one. */
    profileRequested: boolean;
    /** Where their profile is (invited, awaiting review or published); null when they have no profile. */
    profileStatus: ProfileStatus | null;
}

/** Account status choices in the editor filter. */
export type AccountStatusFilter = "all" | "not-linked" | "no-profile";

/** Text shown for each account status choice. */
export const accountStatusLabels: Record<AccountStatusFilter, string> = {
    all: "All",
    "not-linked": "Not linked (profile, no account)",
    "no-profile": "No profile (account, no profile)",
};

/** What the editor list is filtered by, and which page of it to show. An empty string or "all" means that filter is not used. */
export interface IEditorAccountFilter extends IPageRequest {
    /** Words to find in the name, preferred name, email or position. */
    search: string;
    status: AccountStatusFilter;
    /** ISO date (e.g. 2026-09-14): only people who started on or after it. */
    startedFrom: string;
}

/** Results per page on the editor list until the person picks another size. */
export const EDITOR_ACCOUNT_PAGE_SIZE = 10;

export const EMPTY_EDITOR_ACCOUNT_FILTER: IEditorAccountFilter = {
    search: "",
    status: "all",
    startedFrom: "",
    page: 1,
    pageSize: EDITOR_ACCOUNT_PAGE_SIZE,
};

/** The editor list filter in the page address. An unknown account status shows everyone. */
export function editorAccountFilterFromParams(params: SearchParams): IEditorAccountFilter {
    return {
        search: ClientUtils.firstSearchParam(params.search),
        status: ClientUtils.oneOf(
            ClientUtils.firstSearchParam(params.status),
            Object.keys(accountStatusLabels) as AccountStatusFilter[],
            "all",
        ),
        startedFrom: ClientUtils.firstSearchParam(params.startedFrom),
        page: ClientUtils.pageNumberFrom(ClientUtils.firstSearchParam(params.page)),
        pageSize: ClientUtils.pageSizeFrom(ClientUtils.firstSearchParam(params.pageSize), EDITOR_ACCOUNT_PAGE_SIZE),
    };
}

/** Address of the editor list filtered by these values. Unused filters are left out of the address. */
export function editorAccountListPath(filter: IEditorAccountFilter): string {
    return ClientUtils.pathWithParams("/editor", filter, EMPTY_EDITOR_ACCOUNT_FILTER);
}
