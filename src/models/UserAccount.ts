import { ClientUtils, type SearchParams } from "../utils/ClientUtils";
import type { IPageRequest } from "./Paging";
import type { UserRole } from "./UserRole";

/** A user account as managed by admins. */
export interface IUserAccount {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isLocked: boolean;
    /** ISO date of the last sign-in, e.g. 2026-09-14; null when the user has never signed in. */
    lastSignIn: string | null;
}

/** Role choices in the admin filter. */
export type RoleFilter = "all" | UserRole;

/** Lock status choices in the admin filter. */
export type LockStatusFilter = "all" | "active" | "locked";

/** Text shown for each role choice. */
export const roleFilterLabels: Record<RoleFilter, string> = {
    all: "All roles",
    viewer: "Viewers",
    editor: "Editors",
    admin: "Admins",
};

/** Text shown for each lock status choice. */
export const lockStatusFilterLabels: Record<LockStatusFilter, string> = {
    all: "All statuses",
    active: "Active",
    locked: "Locked",
};

/** What the admin user list is filtered by, and which page of it to show. An empty string or "all" means that filter is not used. */
export interface IUserAccountFilter extends IPageRequest {
    /** Words to find in the user's email or the name on their profile. */
    search: string;
    role: RoleFilter;
    lockStatus: LockStatusFilter;
    /** ISO date (e.g. 2026-09-14): only users who last signed in on or after it. */
    signedInSince: string;
}

/** Results per page on the admin user list until the person picks another size. */
export const USER_ACCOUNT_PAGE_SIZE = 10;

export const EMPTY_USER_ACCOUNT_FILTER: IUserAccountFilter = {
    search: "",
    role: "all",
    lockStatus: "all",
    signedInSince: "",
    page: 1,
    pageSize: USER_ACCOUNT_PAGE_SIZE,
};

/** The admin user list filter in the page address. An unknown role or status shows everyone. */
export function userAccountFilterFromParams(params: SearchParams): IUserAccountFilter {
    return {
        search: ClientUtils.firstSearchParam(params.search),
        role: ClientUtils.oneOf(
            ClientUtils.firstSearchParam(params.role),
            Object.keys(roleFilterLabels) as RoleFilter[],
            "all",
        ),
        lockStatus: ClientUtils.oneOf(
            ClientUtils.firstSearchParam(params.lockStatus),
            Object.keys(lockStatusFilterLabels) as LockStatusFilter[],
            "all",
        ),
        signedInSince: ClientUtils.firstSearchParam(params.signedInSince),
        page: ClientUtils.pageNumberFrom(ClientUtils.firstSearchParam(params.page)),
        pageSize: ClientUtils.pageSizeFrom(ClientUtils.firstSearchParam(params.pageSize), USER_ACCOUNT_PAGE_SIZE),
    };
}

/** Address of the admin user list filtered by these values. Unused filters are left out of the address. */
export function userAccountListPath(filter: IUserAccountFilter): string {
    return ClientUtils.pathWithParams("/admin", filter, EMPTY_USER_ACCOUNT_FILTER);
}

/** Text shown for a single user's role. */
export const roleLabels: Record<UserRole, string> = {
    viewer: "Viewer",
    editor: "Editor",
    admin: "Admin",
};
