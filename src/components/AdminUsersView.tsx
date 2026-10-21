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
        if (!pending) return;
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

                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-bold text-white">User and role management</h1>
                    <p className="text-white/50 mt-1.5 text-sm">
                        Change roles and unlock accounts. Everyone starts as a viewer.
                    </p>
                </div>

                {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
                {error && (
                    <div role="alert" className="flex items-center gap-3 bg-error/10 border border-error/30 rounded-xl px-5 py-3">
                        <Icon name="error" className="text-error shrink-0 text-[18px]" />
                        <span className="text-sm text-error">{error}</span>
                    </div>
                )}

                {/* Users table card */}
                {users.items.length === 0 ? (
                    <div className="bg-brand-navy-light border border-white/10 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/5 text-white/30">
                            <Icon name="manage_accounts" className="text-[24px]" />
                        </span>
                        <p className="text-sm text-white/40">No users match these filters.</p>
                    </div>
                ) : (
                    <div className="bg-brand-navy-light border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-[10px] font-bold text-outline uppercase tracking-wider">
                                    <th className="text-left px-5 py-3">Name</th>
                                    <th className="text-left px-5 py-3">Email</th>
                                    <th className="text-left px-5 py-3">Role</th>
                                    <th className="text-left px-5 py-3">Status</th>
                                    <th className="text-left px-5 py-3">Last sign-in</th>
                                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.items.map((user: IUserAccount) => {
                                    const isSelf: boolean = user.id === currentUserId;
                                    return (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-brand-navy/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <PersonCell name={user.name} />
                                                    {isSelf && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-green/15 text-brand-green border border-brand-green/25">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-white/60">{user.email}</td>
                                            <td className="px-5 py-3">
                                                {isSelf ? (
                                                    <span className="text-white/80">{roleLabels[user.role]}</span>
                                                ) : (
                                                    <select
                                                        className="bg-brand-navy border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 outline-none focus:border-brand-green/60 transition-colors"
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
                                            <td className="px-5 py-3">
                                                {user.isLocked ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error/15 text-error border border-error/25">
                                                        Locked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-green/15 text-brand-green border border-brand-green/25">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-white/50 text-xs">
                                                {user.lastSignIn ?? "Never"}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {user.isLocked ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5 hover:text-white transition-all disabled:opacity-40"
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
                                                    <span className="text-xs text-white/25">
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
                )}

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
