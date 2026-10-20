"use client";

import { useState, useTransition } from "react";
import { changeRoleAction, unlockUserAction } from "../app/admin/actions";
import type { UserActionResult } from "../interface/users/UserService";
import {
    emptyUserAccountFilter,
    roleLabels,
    userAccountListPath,
    type IUserAccount,
    type IUserAccountFilter,
    type LockStatusFilter,
    type RoleFilter,
} from "../models/UserAccount";
import type { IPage } from "../models/Paging";
import { UserRole } from "../models/UserRole";
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

const ROLES: UserRole[] = Object.values(UserRole);

/**
 * Admin page body: the toolbar plus a table of users where an admin can change roles and unlock locked accounts.
 * Only admins can open this page, and every change is checked again on the server. The server filters and pages the
 * list; the filter and page live in the page address.
 */
export default function AdminUsersView({ users, filter, currentUserId }: IAdminUsersViewProps) {
    const { inputs, isLoading, typeText, choose, clear }: IServerFilter<IUserAccountFilter> = useServerFilter(
        filter,
        userAccountListPath,
        emptyUserAccountFilter,
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

            <div className="p-6 flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">User and role management</h1>
                    <p className="text-base-content/70 mt-1.5 text-sm">
                        Change roles and unlock accounts. Everyone starts as a viewer.
                    </p>
                </div>

                {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
                {error && (
                    <div role="alert" className="alert alert-error alert-soft">
                        <Icon name="error" />
                        <span>{error}</span>
                    </div>
                )}

                <div
                    aria-busy={isLoading}
                    className={`flex flex-col gap-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}
                >
                    {users.items.length === 0 ? (
                        <div className="bg-base-200 border border-base-300 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
                            <span className="flex size-12 items-center justify-center rounded-full bg-base-300/50 text-base-content/30">
                                <Icon name="manage_accounts" className="text-[24px]" />
                            </span>
                            <p className="text-sm text-base-content/40">No users match these filters.</p>
                        </div>
                    ) : (
                        <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-base-300 text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                                            <th className="text-left px-5 py-3">Name</th>
                                            <th className="text-left px-5 py-3">Email</th>
                                            <th className="text-left px-5 py-3">Role</th>
                                            <th className="text-left px-5 py-3">Status</th>
                                            <th className="text-left px-5 py-3">Last sign-in</th>
                                            <th className="px-5 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.items.map((user: IUserAccount) => {
                                            const isSelf: boolean = user.id === currentUserId;
                                            return (
                                                <tr
                                                    key={user.id}
                                                    className="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <PersonCell name={user.name} />
                                                            {isSelf && (
                                                                <span className="badge badge-success badge-sm">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-base-content/60">{user.email}</td>
                                                    <td className="px-5 py-3">
                                                        {isSelf ? (
                                                            <span>{roleLabels[user.role]}</span>
                                                        ) : (
                                                            <select
                                                                className="select select-sm w-32"
                                                                aria-label={`Role for ${user.name}`}
                                                                value={user.role}
                                                                disabled={isWorking}
                                                                onChange={(
                                                                    event: React.ChangeEvent<HTMLSelectElement>,
                                                                ) =>
                                                                    setPending({
                                                                        user,
                                                                        role: event.target.value as UserRole,
                                                                    })
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
                                                    <td className="px-5 py-3">
                                                        {user.isLocked ? (
                                                            <span className="badge badge-error badge-sm">Locked</span>
                                                        ) : (
                                                            <span className="badge badge-success badge-sm">Active</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-base-content/50 text-xs">
                                                        {user.lastSignIn ?? "Never"}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
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
                                                            <span className="text-xs text-base-content/30">
                                                                {isSelf ? "Protected" : ""}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <Pagination
                        page={users.page}
                        pageSize={users.pageSize}
                        totalCount={users.totalCount}
                        itemLabel="users"
                        onPageChange={(page: number) => choose("page", page)}
                        onPageSizeChange={(pageSize: number) => choose("pageSize", pageSize)}
                    />
                </div>
            </div>

            {pending && (
                <ConfirmDialog
                    title="Change role?"
                    message={`${pending.user.name} will become ${roleLabels[pending.role].toLowerCase()}${
                        pending.role === UserRole.Admin ? " and will be able to manage users and roles" : ""
                    }.`}
                    confirmLabel="Change role"
                    onConfirm={confirmRoleChange}
                    onCancel={() => setPending(null)}
                />
            )}
        </>
    );
}
