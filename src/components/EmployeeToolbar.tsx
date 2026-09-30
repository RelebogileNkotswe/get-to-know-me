import type { EmployeeView } from "../models/Employee";
import Icon from "./Icon";
import DatePicker from "./DatePicker";

interface IEmployeeToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
    view: EmployeeView;
    onViewChange: (view: EmployeeView) => void;
}

/**
 * Toolbar under the navbar with a search input, a start date picker and a list/card view toggle.
 */
export default function EmployeeToolbar({
    search,
    onSearchChange,
    startDate,
    onStartDateChange,
    view,
    onViewChange,
}: IEmployeeToolbarProps) {
    const hasFilters: boolean = search !== "" || startDate !== "";

    function clearFilters(): void {
        onSearchChange("");
        onStartDateChange("");
    }

    return (
        <section className="bg-base-100 border-base-300 flex flex-wrap items-center gap-3 border-b px-6 py-3">
            <label className="input w-full sm:w-72">
                <Icon name="search" />
                <input
                    type="search"
                    placeholder="Search employees"
                    aria-label="Search employees"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                />
            </label>
            <DatePicker label="Started on or after" value={startDate} onChange={onStartDateChange} />
            <button type="button" className="btn btn-ghost" disabled={!hasFilters} onClick={clearFilters}>
                <Icon name="filter_alt_off" />
                Clear
            </button>
            <div className="join ml-auto" role="group" aria-label="View">
                <button
                    type="button"
                    className={`join-item btn ${view === "list" ? "btn-active" : ""}`}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    onClick={() => onViewChange("list")}
                >
                    <Icon name="view_list" />
                </button>
                <button
                    type="button"
                    className={`join-item btn ${view === "card" ? "btn-active" : ""}`}
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
