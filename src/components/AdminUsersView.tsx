"use client";

import { useState, useTransition } from "react";
import { changeRoleAction, unlockUserAction } from "../app/admin/actions";
import type { UserActionResult } from "../interface/users/UserService";
import { roleLabels, type IUserAccount, type LockStatusFilter, type RoleFilter } from "../models/UserAccount";
import type { UserRole } from "../models/UserRole";
import ActionNotice from "./ActionNotice";
import AdminToolbar from "./AdminToolbar";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import PersonCell from "./PersonCell";

interface IAdminUsersViewProps {
    /** Every user account, loaded on the server. */
    users: IUserAccount[];
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
 * Only admins can open this page, and every change is checked again on the server.
 */
export default function AdminUsersView({ users, currentUserId }: IAdminUsersViewProps) {
    const [search, setSearch] = useState<string>("");
    const [role, setRole] = useState<RoleFilter>("all");
    const [lockStatus, setLockStatus] = useState<LockStatusFilter>("all");
    const [signedInSince, setSignedInSince] = useState<string>("");
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

    const searchText: string = search.trim().toLowerCase();
    const visibleUsers: IUserAccount[] = users.filter((user: IUserAccount) => {
        const matchesSearch: boolean =
            searchText === "" ||
            user.name.toLowerCase().includes(searchText) ||
            user.email.toLowerCase().includes(searchText);
        const matchesRole: boolean = role === "all" || user.role === role;
        const matchesLockStatus: boolean =
            lockStatus === "all" || (lockStatus === "locked" ? user.isLocked : !user.isLocked);
        const matchesSignedInSince: boolean =
            signedInSince === "" || (user.lastSignIn !== null && user.lastSignIn >= signedInSince);
        return matchesSearch && matchesRole && matchesLockStatus && matchesSignedInSince;
    });

    return (
        <>
            <AdminToolbar
                search={search}
                onSearchChange={setSearch}
                role={role}
                onRoleChange={setRole}
                lockStatus={lockStatus}
                onLockStatusChange={setLockStatus}
                signedInSince={signedInSince}
                onSignedInSinceChange={setSignedInSince}
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
                <div className="overflow-x-auto">
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
                            {visibleUsers.map((user: IUserAccount) => {
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
                            {visibleUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center">
                                        Nothing matches these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
