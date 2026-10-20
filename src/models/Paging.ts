/** Which page of a list to show, and how many results go on a page. */
export interface IPageRequest {
    /** Page number, starting at 1. */
    page: number;
    /** One of ClientUtils.pageSizes. */
    pageSize: number;
}

/** One page of a list, with the total number of results across all pages. */
export interface IPage<T> {
    items: T[];
    /** The page shown, starting at 1. A page past the end is moved back to the last page. */
    page: number;
    pageSize: number;
    totalCount: number;
}
