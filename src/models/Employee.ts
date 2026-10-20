import { ClientUtils, type SearchParams } from "../utils/ClientUtils";
import type { IPageRequest } from "./Paging";

/** An employee shown in the employee list. */
export interface IEmployee {
    id: string;
    name: string;
    position: string;
    /** ISO date, e.g. 2026-09-14. */
    startDate: string;
    /** What to call them; empty when not entered. */
    preferredName: string;
    /** "Beyond the office gates" text, shown as a short snippet on the card; empty when not entered. */
    hobbies: string;
    /** True when a user account is linked to this profile by email. */
    hasAccount: boolean;
    /** Address the photo loads from, or null when they have none and their initials are shown instead. */
    photoUrl: string | null;
}

/** What the employee list is filtered by, and which page of it to show. An empty string means that filter is not used. */
export interface IEmployeeFilter extends IPageRequest {
    /** Words to find in the name, preferred name, position or profile text. */
    search: string;
    /** ISO date (e.g. 2026-09-14): only people who started on or after it. */
    startedFrom: string;
}

/** Results per page on the employee list until the person picks another size. */
export const EMPLOYEE_PAGE_SIZE = 20;

export const emptyEmployeeFilter: IEmployeeFilter = {
    search: "",
    startedFrom: "",
    page: 1,
    pageSize: EMPLOYEE_PAGE_SIZE,
};

/** The employee list filter in the page address. */
export function employeeFilterFromParams(params: SearchParams): IEmployeeFilter {
    return {
        search: ClientUtils.firstSearchParam(params.search),
        startedFrom: ClientUtils.firstSearchParam(params.startedFrom),
        page: ClientUtils.pageNumberFrom(ClientUtils.firstSearchParam(params.page)),
        pageSize: ClientUtils.pageSizeFrom(ClientUtils.firstSearchParam(params.pageSize), EMPLOYEE_PAGE_SIZE),
    };
}

/** Address of the employee list filtered by these values. Unused filters are left out of the address. */
export function employeeListPath(filter: IEmployeeFilter): string {
    return ClientUtils.pathWithParams("/", filter, emptyEmployeeFilter);
}

/** How many days after starting someone still counts as a new starter. */
export const NEW_STARTER_DAYS = 30;

/** How many days before their start date someone already shows as a new starter, so colleagues can welcome them in advance. */
export const NEW_STARTER_DAYS_AHEAD = 10;

/** First and last start dates, as ISO dates, of the people who count as new starters on a given day. */
export interface INewStarterDates {
    earliest: string;
    latest: string;
}

/** Start dates from 30 days before today up to 10 days after it count as new starters. */
export function newStarterDates(today: Date): INewStarterDates {
    const todayIso: string = today.toISOString().slice(0, 10);
    const earliest: Date = new Date(`${todayIso}T00:00:00Z`);
    earliest.setUTCDate(earliest.getUTCDate() - NEW_STARTER_DAYS);
    const latest: Date = new Date(`${todayIso}T00:00:00Z`);
    latest.setUTCDate(latest.getUTCDate() + NEW_STARTER_DAYS_AHEAD);
    return { earliest: earliest.toISOString().slice(0, 10), latest: latest.toISOString().slice(0, 10) };
}

/** How the employee list is displayed. */
export type EmployeeView = "list" | "card";
