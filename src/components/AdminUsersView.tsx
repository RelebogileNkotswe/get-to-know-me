"use client";

import { useState, useTransition } from "react";
import { changeRoleAction, unlockUserAction } from "../app/admin/actions";
import type { UserActionResult } from "../interface/users/UserService";
import {
    EMPTY_USER_ACCOUNT_FILTER,
    roleLabels,
    userAccountListPath,
    type IUserAccount,
    type IUserAccountFilter,
    type LockStatusFilter,
    type RoleFilter,
} from "../models/UserAccount";
import type { IPage } from "../models/Paging";
import type { UserRole } from "../models/UserRole";
import ActionNotice from "./ActionNotice";
import AdminToolbar from "./AdminToolbar";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import Pagination from "./Pagination";
import PersonCell from "./PersonCell";
import { useServerFilter, type IServerFilter } from "./ServerFilter";

interface IAdminUsersViewProps {
    /** One page of the user accounts that match the filter, loaded on the server. */
    users: IPage<IUserAccount>;
    /** The filter the list was loaded with, read from the page address. */
    filter: IUserAccountFilter;
    /** The signed-in admin, whose own role cannot be changed here. */
    currentUserId: string;
}

interface IPendingRoleChange {
    user: IUserAccount;
    role: UserRole;
}

const ROLES: UserRole[] = ["viewer", "editor", "admin"];

/**
 * Admin page body: the toolbar plus a table of users where an admin can change roles and unlock locked accounts.
 * Only admins can open this page, and every change is checked again on the server. The server filters and pages the
 * list; the filter and page live in the page address.
 */
export default function AdminUsersView({ users, filter, currentUserId }: IAdminUsersViewProps) {
    const { inputs, isLoading, typeText, choose, clear }: IServerFilter<IUserAccountFilter> = useServerFilter(
        filter,
        userAccountListPath,
        EMPTY_USER_ACCOUNT_FILTER,
    );
    const [pending, setPending] = useState<IPendingRoleChange | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isWorking, startWorking] = useTransition();

    function runAction(action: () => Promise<UserActionResult>, successMessage: string): void {
        setNotice(null);
        setError(null);
        startWorking(async () => {
            const result: UserActionResult = await action();
            if (result.ok) {
                setNotice(successMessage);
            } else {
                setError(result.error);
            }
        });
    }

    function confirmRoleChange(): void {
        if (!pending) {
            return;
        }
        const { user, role: newRole } = pending;
        setPending(null);
        runAction(
            () => changeRoleAction(user.id, newRole),
            `${user.name} is now ${roleLabels[newRole].toLowerCase()}. It applies the next time they open a page.`,
        );
    }

    return (
        <>
            <AdminToolbar
                search={inputs.search}
                onSearchChange={(search: string) => typeText("search", search)}
                role={inputs.role}
                onRoleChange={(role: RoleFilter) => choose("role", role)}
                lockStatus={inputs.lockStatus}
                onLockStatusChange={(lockStatus: LockStatusFilter) => choose("lockStatus", lockStatus)}
                signedInSince={inputs.signedInSince}
                onSignedInSinceChange={(signedInSince: string) => choose("signedInSince", signedInSince)}
                onClear={clear}
            />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">User and role management</h1>
                <p className="text-base-content/70 mt-2 mb-6">
                    Change roles and unlock accounts. Everyone starts as a viewer.
                </p>
                {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
                {error && (
                    <div role="alert" className="alert alert-error alert-soft mb-4">
                        <span>{error}</span>
                    </div>
                )}
                <div
                    aria-busy={isLoading}
                    className={`overflow-x-auto transition-opacity ${isLoading ? "opacity-60" : ""}`}
                >
                    <table className="table-zebra table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last sign-in</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.items.map((user: IUserAccount) => {
                                const isSelf: boolean = user.id === currentUserId;
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <PersonCell name={user.name} />
                                            {isSelf && <span className="badge badge-sm badge-neutral ml-11">You</span>}
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            {isSelf ? (
                                                <span>{roleLabels[user.role]}</span>
                                            ) : (
                                                <select
                                                    className="select select-sm w-32"
                                                    aria-label={`Role for ${user.name}`}
                                                    value={user.role}
                                                    disabled={isWorking}
                                                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                                        setPending({ user, role: event.target.value as UserRole })
                                                    }
                                                >
                                                    {ROLES.map((option: UserRole) => (
                                                        <option key={option} value={option}>
                                                            {roleLabels[option]}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            {user.isLocked ? (
                                                <span className="badge badge-error badge-sm">Locked</span>
                                            ) : (
                                                <span className="badge badge-success badge-sm">Active</span>
                                            )}
                                        </td>
                                        <td>{user.lastSignIn ?? "Never"}</td>
                                        <td>
                                            {user.isLocked ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm"
                                                    aria-label={`Unlock ${user.name}`}
                                                    disabled={isWorking}
                                                    onClick={() =>
                                                        runAction(
                                                            () => unlockUserAction(user.id),
                                                            `Unlocked the account for ${user.name}.`,
                                                        )
                                                    }
                                                >
                                                    <Icon name="lock_open" />
                                                    Unlock
                                                </button>
                                            ) : (
                                                <span className="text-base-content/50 text-sm">
                                                    {isSelf ? "Protected" : ""}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {users.items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center">
                                        Nothing matches these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={users.page}
                    pageSize={users.pageSize}
                    totalCount={users.totalCount}
                    itemLabel="users"
                    onPageChange={(page: number) => choose("page", page)}
                    onPageSizeChange={(pageSize: number) => choose("pageSize", pageSize)}
                />
            </div>
            {pending && (
                <ConfirmDialog
                    title="Change role?"
                    message={`${pending.user.name} will become ${roleLabels[pending.role].toLowerCase()}${
                        pending.role === "admin" ? " and will be able to manage users and roles" : ""
                    }.`}
                    confirmLabel="Change role"
                    onConfirm={confirmRoleChange}
                    onCancel={() => setPending(null)}
                />
            )}
        </>
    );
}
