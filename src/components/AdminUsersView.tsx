"use client";

import { useState } from "react";
import { authService } from "../logic/auth/AuthService";
import { hasRoleAtLeast } from "../models/UserRole";
import { roleLabels, type IUserAccount, type LockStatusFilter, type RoleFilter } from "../models/UserAccount";
import ActionNotice from "./ActionNotice";
import AdminToolbar from "./AdminToolbar";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import PersonCell from "./PersonCell";

// TODO: replace with users loaded from the API once it exists.
const sampleUsers: IUserAccount[] = [
    {
        id: "1",
        name: "Sample User 1",
        email: "user1@example.com",
        role: "admin",
        isLocked: false,
        lastSignIn: "2026-09-28",
    },
    {
        id: "2",
        name: "Sample User 2",
        email: "user2@example.com",
        role: "editor",
        isLocked: false,
        lastSignIn: "2026-09-20",
    },
    {
        id: "3",
        name: "Sample User 3",
        email: "user3@example.com",
        role: "viewer",
        isLocked: true,
        lastSignIn: "2026-08-15",
    },
    {
        id: "4",
        name: "Sample User 4",
        email: "user4@example.com",
        role: "viewer",
        isLocked: false,
        lastSignIn: null,
    },
];

type UserAction = "block" | "delete";

interface IPendingUserAction {
    user: IUserAccount;
    action: UserAction;
}

/**
 * Admin page body: the toolbar plus a table of users with their role, lock status and last sign-in.
 */
export default function AdminUsersView() {
    const [search, setSearch] = useState<string>("");
    const [role, setRole] = useState<RoleFilter>("all");
    const [lockStatus, setLockStatus] = useState<LockStatusFilter>("all");
    const [signedInSince, setSignedInSince] = useState<string>("");
    const [users, setUsers] = useState<IUserAccount[]>(sampleUsers);
    const [pending, setPending] = useState<IPendingUserAction | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const canManageUsers: boolean = hasRoleAtLeast(authService.getCurrentRole(), "admin");

    // TODO: the three actions below only change the sample data on this page until the API exists.
    function setLocked(user: IUserAccount, isLocked: boolean): void {
        setUsers((current: IUserAccount[]) =>
            current.map((item: IUserAccount) => (item.id === user.id ? { ...item, isLocked } : item)),
        );
        setNotice(isLocked ? `Blocked ${user.name}.` : `Unlocked ${user.name}.`);
    }

    function confirmPendingAction(): void {
        if (!pending) {
            return;
        }
        if (pending.action === "block") {
            setLocked(pending.user, true);
        } else {
            const target: IUserAccount = pending.user;
            setUsers((current: IUserAccount[]) => current.filter((item: IUserAccount) => item.id !== target.id));
            setNotice(`Deleted the account for ${target.name}.`);
        }
        setPending(null);
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
                <h1 className="text-2xl font-semibold">Admin</h1>
                <p className="text-base-content/70 mt-2 mb-6">Users, their roles and locked accounts.</p>
                {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
                <div className="overflow-x-auto">
                    <table className="table-zebra table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last sign-in</th>
                                {canManageUsers && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleUsers.map((user: IUserAccount) => (
                                <tr key={user.id}>
                                    <td>
                                        <PersonCell name={user.name} />
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{roleLabels[user.role]}</td>
                                    <td>
                                        {user.isLocked ? (
                                            <span className="badge badge-error badge-sm">Locked</span>
                                        ) : (
                                            <span className="badge badge-success badge-sm">Active</span>
                                        )}
                                    </td>
                                    <td>{user.lastSignIn ?? "Never"}</td>
                                    {canManageUsers && (
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {user.isLocked ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        aria-label={`Unlock ${user.name}`}
                                                        onClick={() => setLocked(user, false)}
                                                    >
                                                        <Icon name="lock_open" />
                                                        Unlock
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        aria-label={`Block ${user.name}`}
                                                        onClick={() => setPending({ user, action: "block" })}
                                                    >
                                                        <Icon name="block" />
                                                        Block
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm text-error"
                                                    aria-label={`Delete ${user.name}`}
                                                    onClick={() => setPending({ user, action: "delete" })}
                                                >
                                                    <Icon name="delete" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {visibleUsers.length === 0 && (
                                <tr>
                                    <td colSpan={canManageUsers ? 6 : 5} className="text-center">
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
                    title={pending.action === "block" ? "Block account?" : "Delete account?"}
                    message={
                        pending.action === "block"
                            ? `${pending.user.name} will not be able to sign in until an admin unlocks the account.`
                            : `This deletes the user account for ${pending.user.name}. It cannot be undone.`
                    }
                    confirmLabel={pending.action === "block" ? "Block account" : "Delete account"}
                    isDestructive
                    onConfirm={confirmPendingAction}
                    onCancel={() => setPending(null)}
                />
            )}
        </>
    );
}
