import type { EmployeeAccountStatus, EmployeeView } from "../models/Employee";
import Icon from "./Icon";
import DatePicker from "./DatePicker";

interface IEmployeeToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    /** Resets all filters and navigates back to the unfiltered list. */
    onClear: () => void;
    view: EmployeeView;
    onViewChange: (view: EmployeeView) => void;
    /** Current account-link status filter, reflected in the URL. */
    statusFilter: EmployeeAccountStatus;
    onStatusFilterChange: (filter: EmployeeAccountStatus) => void;
}

/**
 * Toolbar under the navbar with a search input, a start date picker and a list/card view toggle.
 */
export default function EmployeeToolbar({
    search,
    onSearchChange,
    startDate,
    onStartDateChange,
    onClear,
    view,
    onViewChange,
    statusFilter,
    onStatusFilterChange,
}: IEmployeeToolbarProps) {
    const hasFilters: boolean = search !== "" || startDate !== "" || statusFilter !== "all";

    return (
        <section className="border-b border-base-300 flex flex-wrap items-center gap-3 px-6 py-4 bg-base-100">
            <label className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-full px-4 py-2 w-full sm:w-96 focus-within:border-primary/40 transition-colors">
                <Icon name="search" className="text-base-content/40" />
                <input
                    type="search"
                    placeholder="Search name, position or profile text"
                    aria-label="Search by name, position or profile text"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                    className="bg-transparent text-sm text-base-content placeholder:text-base-content/40 flex-1 outline-none"
                />
            </label>
            <DatePicker label="Started on or after" value={startDate} onChange={onStartDateChange} />
            <button
                type="button"
                className="flex items-center gap-1 text-sm text-base-content/50 hover:text-base-content transition-colors disabled:opacity-40"
                disabled={!hasFilters}
                onClick={onClear}
            >
                <Icon name="filter_alt_off" />
                Clear
            </button>
            <div
                className="ml-auto flex border border-base-300 rounded-lg overflow-hidden"
                role="group"
                aria-label="View"
            >
                <button
                    type="button"
                    className={`p-2 transition-colors ${view === "list" ? "bg-brand-green text-brand-navy" : "bg-base-100 text-base-content/50 hover:text-base-content"}`}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    onClick={() => onViewChange("list")}
                >
                    <Icon name="view_list" />
                </button>
                <button
                    type="button"
                    className={`p-2 transition-colors ${view === "card" ? "bg-brand-green text-brand-navy" : "bg-base-100 text-base-content/50 hover:text-base-content"}`}
                    aria-label="Card view"
                    aria-pressed={view === "card"}
                    onClick={() => onViewChange("card")}
                >
                    <Icon name="grid_view" />
                </button>
            </div>
        </section>
    );
}
