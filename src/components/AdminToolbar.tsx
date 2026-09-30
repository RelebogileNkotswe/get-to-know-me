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
}: IAdminToolbarProps) {
    const hasFilters: boolean = search !== "" || role !== "all" || lockStatus !== "all" || signedInSince !== "";

    function clearFilters(): void {
        onSearchChange("");
        onRoleChange("all");
        onLockStatusChange("all");
        onSignedInSinceChange("");
    }

    return (
        <section className="bg-base-100 border-base-300 flex flex-wrap items-center gap-3 border-b px-6 py-3">
            <label className="input w-full sm:w-72">
                <Icon name="search" />
                <input
                    type="search"
                    placeholder="Search users"
                    aria-label="Search users"
                    value={search}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
                />
            </label>
            <select
                className="select w-full sm:w-44"
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
                className="select w-full sm:w-44"
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
            <button type="button" className="btn btn-ghost" disabled={!hasFilters} onClick={clearFilters}>
                <Icon name="filter_alt_off" />
                Clear
            </button>
        </section>
    );
}
