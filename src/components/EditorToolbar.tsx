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
    /** Clears every filter together. */
    onClear: () => void;
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
    onClear,
}: IEditorToolbarProps) {
    const hasFilters: boolean = search !== "" || status !== "all" || startDate !== "";

    return (
        <section className="border-b border-base-300 flex flex-wrap items-center gap-3 px-6 py-4 bg-base-100">
            <label className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-full px-4 py-2 w-full sm:w-72 focus-within:border-primary/40 transition-colors">
                <Icon name="search" className="text-base-content/40" />
                <input
                    type="search"
                    placeholder="Search accounts"
                    aria-label="Search accounts"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                    className="bg-transparent text-sm text-base-content placeholder:text-base-content/40 flex-1 outline-none"
                />
            </label>
            <select
                className="bg-base-200 border border-base-300 rounded-full px-4 py-2 text-sm text-base-content outline-none focus:border-primary/40 transition-colors w-full sm:w-72"
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
            <button
                type="button"
                className="flex items-center gap-1 text-sm text-base-content/50 hover:text-base-content transition-colors disabled:opacity-40"
                disabled={!hasFilters}
                onClick={onClear}
            >
                <Icon name="filter_alt_off" />
                Clear
            </button>
        </section>
    );
}
