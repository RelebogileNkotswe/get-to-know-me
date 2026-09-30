import { accountStatusLabels, type AccountStatusFilter } from "../models/EditorAccount";
import Icon from "./Icon";
import DatePicker from "./DatePicker";

interface IEditorToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    status: AccountStatusFilter;
    onStatusChange: (status: AccountStatusFilter) => void;
    startDate: string;
    onStartDateChange: (value: string) => void;
}

/**
 * Toolbar under the navbar with a search input, an account status dropdown, a start date picker and a clear button.
 */
export default function EditorToolbar({
    search,
    onSearchChange,
    status,
    onStatusChange,
    startDate,
    onStartDateChange,
}: IEditorToolbarProps) {
    const hasFilters: boolean = search !== "" || status !== "all" || startDate !== "";

    function clearFilters(): void {
        onSearchChange("");
        onStatusChange("all");
        onStartDateChange("");
    }

    return (
        <section className="bg-base-100 border-base-300 flex flex-wrap items-center gap-3 border-b px-6 py-3">
            <label className="input w-full sm:w-72">
                <Icon name="search" />
                <input
                    type="search"
                    placeholder="Search accounts"
                    aria-label="Search accounts"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                />
            </label>
            <select
                className="select w-full sm:w-72"
                aria-label="Account status"
                value={status}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    onStatusChange(event.target.value as AccountStatusFilter)
                }
            >
                {(Object.keys(accountStatusLabels) as AccountStatusFilter[]).map((option: AccountStatusFilter) => (
                    <option key={option} value={option}>
                        {accountStatusLabels[option]}
                    </option>
                ))}
            </select>
            <DatePicker label="Started on or after" value={startDate} onChange={onStartDateChange} />
            <button type="button" className="btn btn-ghost" disabled={!hasFilters} onClick={clearFilters}>
                <Icon name="filter_alt_off" />
                Clear
            </button>
        </section>
    );
}
