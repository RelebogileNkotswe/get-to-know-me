import { AuditAction, auditActionLabels, type AuditActionFilter } from "../models/Audit";
import DatePicker from "./DatePicker";
import Icon from "./Icon";

interface IAuditToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    action: AuditActionFilter;
    onActionChange: (action: AuditActionFilter) => void;
    from: string;
    onFromChange: (value: string) => void;
    to: string;
    onToChange: (value: string) => void;
    /** Clears every filter together. */
    onClear: () => void;
}

/**
 * Toolbar under the navbar for the audit log: a search by email, an action dropdown, a date range and a clear button.
 */
export default function AuditToolbar({
    search,
    onSearchChange,
    action,
    onActionChange,
    from,
    onFromChange,
    to,
    onToChange,
    onClear,
}: IAuditToolbarProps) {
    const hasFilters: boolean = search !== "" || action !== "all" || from !== "" || to !== "";

    return (
        <section className="border-b border-white/8 flex flex-wrap items-center gap-3 px-6 py-4 bg-brand-navy">
            <label className="flex items-center gap-2 bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 w-full sm:w-72 focus-within:border-brand-green/40 transition-colors">
                <Icon name="search" />
                <input
                    type="search"
                    placeholder="Search by email"
                    aria-label="Search by the email of who did it or who it was done to"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                    className="bg-transparent text-sm text-white placeholder:text-white/30 flex-1 outline-none"
                />
            </label>
            <select
                className="bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 text-sm text-white/80 outline-none focus:border-brand-green/40 transition-colors w-full sm:w-56"
                aria-label="Action"
                value={action}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    onActionChange(event.target.value as AuditActionFilter)
                }
            >
                <option value="all">All actions</option>
                {Object.values(AuditAction).map((option: AuditAction) => (
                    <option key={option} value={option}>
                        {auditActionLabels[option]}
                    </option>
                ))}
            </select>
            <DatePicker label="From" value={from} onChange={onFromChange} />
            <DatePicker label="To" value={to} onChange={onToChange} />
            <button
                type="button"
                className="flex items-center gap-1 text-sm text-outline hover:text-white transition-colors disabled:opacity-40"
                disabled={!hasFilters}
                onClick={onClear}
            >
                <Icon name="filter_alt_off" />
                Clear
            </button>
        </section>
    );
}
