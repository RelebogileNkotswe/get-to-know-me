import {
    lockStatusFilterLabels,
    roleFilterLabels,
    type LockStatusFilter,
    type RoleFilter,
} from "../models/UserAccount";
import DatePicker from "./DatePicker";
import Icon from "./Icon";

interface IAdminToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    role: RoleFilter;
    onRoleChange: (role: RoleFilter) => void;
    lockStatus: LockStatusFilter;
    onLockStatusChange: (lockStatus: LockStatusFilter) => void;
    signedInSince: string;
    onSignedInSinceChange: (value: string) => void;
    /** Clears every filter together. */
    onClear: () => void;
}

/**
 * Toolbar under the navbar with a search input, role and status dropdowns, a last sign-in date picker
 * and a clear button.
 */
export default function AdminToolbar({
    search,
    onSearchChange,
    role,
    onRoleChange,
    lockStatus,
    onLockStatusChange,
    signedInSince,
    onSignedInSinceChange,
    onClear,
}: IAdminToolbarProps) {
    const hasFilters: boolean = search !== "" || role !== "all" || lockStatus !== "all" || signedInSince !== "";

    return (
        <section className="border-b border-white/8 flex flex-wrap items-center gap-3 px-6 py-4 bg-brand-navy">
            <label className="flex items-center gap-2 bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 w-full sm:w-72 focus-within:border-brand-green/40 transition-colors">
                <Icon name="search" />
                <input
                    type="search"
                    placeholder="Search users"
                    aria-label="Search users"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                    className="bg-transparent text-sm text-white placeholder:text-white/30 flex-1 outline-none"
                />
            </label>
            <select
                className="bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 text-sm text-white/80 outline-none focus:border-brand-green/40 transition-colors w-full sm:w-44"
                aria-label="Role"
                value={role}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    onRoleChange(event.target.value as RoleFilter)
                }
            >
                {(Object.keys(roleFilterLabels) as RoleFilter[]).map((option: RoleFilter) => (
                    <option key={option} value={option}>
                        {roleFilterLabels[option]}
                    </option>
                ))}
            </select>
            <select
                className="bg-brand-navy-light border border-white/10 rounded-full px-4 py-2 text-sm text-white/80 outline-none focus:border-brand-green/40 transition-colors w-full sm:w-44"
                aria-label="Account status"
                value={lockStatus}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    onLockStatusChange(event.target.value as LockStatusFilter)
                }
            >
                {(Object.keys(lockStatusFilterLabels) as LockStatusFilter[]).map((option: LockStatusFilter) => (
                    <option key={option} value={option}>
                        {lockStatusFilterLabels[option]}
                    </option>
                ))}
            </select>
            <DatePicker label="Signed in on or after" value={signedInSince} onChange={onSignedInSinceChange} />
            <button type="button" className="flex items-center gap-1 text-sm text-outline hover:text-white transition-colors disabled:opacity-40" disabled={!hasFilters} onClick={onClear}>
                <Icon name="filter_alt_off" />
                Clear
            </button>
        </section>
    );
}
