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
        <section className="border-b border-white/8 flex flex-wrap items-center gap-3 px-6 py-4 bg-brand-navy">
            <label className="flex items-center gap-2 bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 w-full sm:w-96 focus-within:border-brand-green/40 transition-colors">
                <Icon name="search" />
                <input
                    type="search"
                    placeholder="Search name, position or profile text"
                    aria-label="Search by name, position or profile text"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                    className="bg-transparent text-sm text-white placeholder:text-white/30 flex-1 outline-none"
                />
            </label>
            <DatePicker label="Started on or after" value={startDate} onChange={onStartDateChange} />
            <button type="button" className="flex items-center gap-1 text-sm text-outline hover:text-white transition-colors disabled:opacity-40" disabled={!hasFilters} onClick={clearFilters}>
                <Icon name="filter_alt_off" />
                Clear
            </button>
            <div className="ml-auto flex border border-white/10 rounded-lg overflow-hidden" role="group" aria-label="View">
                <button
                    type="button"
                    className={`p-2 transition-colors ${view === "list" ? "bg-brand-green text-brand-navy" : "bg-brand-navy text-outline hover:text-white"}`}
                    aria-label="List view"
                    aria-pressed={view === "list"}
                    onClick={() => onViewChange("list")}
                >
                    <Icon name="view_list" />
                </button>
                <button
                    type="button"
                    className={`p-2 transition-colors ${view === "card" ? "bg-brand-green text-brand-navy" : "bg-brand-navy text-outline hover:text-white"}`}
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
