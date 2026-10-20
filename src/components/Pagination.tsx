import { ClientUtils } from "../utils/ClientUtils";
import Icon from "./Icon";

interface IPaginationProps {
    /** The page shown, starting at 1. */
    page: number;
    pageSize: number;
    totalCount: number;
    /** Plural word for the results, e.g. "employees". */
    itemLabel: string;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

/** Page numbers to show as buttons: the first, the last and those next to the current page. Null marks a gap. */
function visiblePages(page: number, pageCount: number): (number | null)[] {
    const pages: (number | null)[] = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        if (pageNumber === 1 || pageNumber === pageCount || Math.abs(pageNumber - page) <= 1) {
            pages.push(pageNumber);
        } else if (pages[pages.length - 1] !== null) {
            pages.push(null);
        }
    }
    return pages;
}

/**
 * Paging bar under a list: how many results there are, how many to show per page (one of ClientUtils.pageSizes), and
 * buttons to move between pages. Shown only when the list has results.
 */
export default function Pagination({
    page,
    pageSize,
    totalCount,
    itemLabel,
    onPageChange,
    onPageSizeChange,
}: IPaginationProps) {
    if (totalCount === 0) {
        return null;
    }
    const pageCount: number = ClientUtils.pageCount(totalCount, pageSize);
    const firstShown: number = (page - 1) * pageSize + 1;
    const lastShown: number = Math.min(page * pageSize, totalCount);

    return (
        <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base-content/70 text-sm">
                Showing {firstShown}–{lastShown} of {totalCount} {itemLabel}
            </p>
            <div className="flex flex-wrap items-center gap-3">
                <label className="text-base-content/70 flex items-center gap-2 text-sm">
                    Per page
                    <select
                        className="select select-sm w-20"
                        value={pageSize}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                            onPageSizeChange(Number(event.target.value))
                        }
                    >
                        {ClientUtils.pageSizes.map((size: number) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>
                {pageCount > 1 && (
                    <div className="join">
                        <button
                            type="button"
                            className="join-item btn btn-sm"
                            aria-label="Previous page"
                            disabled={page === 1}
                            onClick={() => onPageChange(page - 1)}
                        >
                            <Icon name="chevron_left" />
                        </button>
                        {visiblePages(page, pageCount).map((pageNumber: number | null, index: number) =>
                            pageNumber === null ? (
                                <button
                                    key={`gap-${index}`}
                                    type="button"
                                    className="join-item btn btn-sm btn-disabled"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    …
                                </button>
                            ) : (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    className={`join-item btn btn-sm ${pageNumber === page ? "btn-active" : ""}`}
                                    aria-label={`Page ${pageNumber}`}
                                    aria-current={pageNumber === page ? "page" : undefined}
                                    onClick={() => onPageChange(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            ),
                        )}
                        <button
                            type="button"
                            className="join-item btn btn-sm"
                            aria-label="Next page"
                            disabled={page === pageCount}
                            onClick={() => onPageChange(page + 1)}
                        >
                            <Icon name="chevron_right" />
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
