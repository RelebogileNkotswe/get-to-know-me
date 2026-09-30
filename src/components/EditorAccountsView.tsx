"use client";

import Link from "next/link";
import { useState } from "react";
import { authService } from "../logic/auth/AuthService";
import { hasRoleAtLeast } from "../models/UserRole";
import { matchesAccountStatus, type AccountStatusFilter, type IEditorAccount } from "../models/EditorAccount";
import ActionNotice from "./ActionNotice";
import ConfirmDialog from "./ConfirmDialog";
import EditorToolbar from "./EditorToolbar";
import Icon from "./Icon";
import PersonCell from "./PersonCell";

// TODO: replace with accounts and profiles loaded from the API once it exists.
const sampleAccounts: IEditorAccount[] = [
    {
        id: "1",
        name: "Sample Employee 1",
        email: "sample1@singular.co.za",
        position: "Developer",
        startDate: "2026-09-14",
        hasProfile: true,
        hasAccount: true,
    },
    {
        id: "2",
        name: "Sample Employee 2",
        email: "sample2@singular.co.za",
        position: "Analyst",
        startDate: "2026-10-05",
        hasProfile: true,
        hasAccount: false,
    },
    {
        id: "3",
        name: "Sample Employee 3",
        email: "sample3@singular.co.za",
        position: "Designer",
        startDate: "2026-10-12",
        hasProfile: true,
        hasAccount: false,
    },
    {
        id: "4",
        name: "Sample Employee 4",
        email: "sample4@example.com",
        position: null,
        startDate: null,
        hasProfile: false,
        hasAccount: true,
    },
];

/**
 * Editor page body: the toolbar plus a table of accounts and their profile and account status.
 */
export default function EditorAccountsView() {
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<AccountStatusFilter>("all");
    const [startDate, setStartDate] = useState<string>("");
    const [accounts, setAccounts] = useState<IEditorAccount[]>(sampleAccounts);
    const [pendingDelete, setPendingDelete] = useState<IEditorAccount | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const canDeleteProfiles: boolean = hasRoleAtLeast(authService.getCurrentRole(), "editor");

    function confirmDeleteProfile(): void {
        if (!pendingDelete) {
            return;
        }
        const target: IEditorAccount = pendingDelete;
        // TODO: delete the profile through the API once it exists; this only changes the sample data on this page.
        setAccounts((current: IEditorAccount[]) =>
            target.hasAccount
                ? current.map((account: IEditorAccount) =>
                      account.id === target.id
                          ? { ...account, hasProfile: false, position: null, startDate: null }
                          : account,
                  )
                : current.filter((account: IEditorAccount) => account.id !== target.id),
        );
        setNotice(`Deleted the Get To Know Me profile for ${target.name}.`);
        setPendingDelete(null);
    }

    const searchText: string = search.trim().toLowerCase();
    const visibleAccounts: IEditorAccount[] = accounts.filter((account: IEditorAccount) => {
        const matchesSearch: boolean =
            searchText === "" ||
            account.name.toLowerCase().includes(searchText) ||
            account.email.toLowerCase().includes(searchText) ||
            (account.position ?? "").toLowerCase().includes(searchText);
        const matchesStartDate: boolean =
            startDate === "" || (account.startDate !== null && account.startDate >= startDate);
        return matchesSearch && matchesStartDate && matchesAccountStatus(account, status);
    });

    return (
        <>
            <EditorToolbar
                search={search}
                onSearchChange={setSearch}
                status={status}
                onStatusChange={setStatus}
                startDate={startDate}
                onStartDateChange={setStartDate}
            />
            <div className="p-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Create/edit profile</h1>
                        <p className="text-base-content/70 mt-2">
                            Everyone with a Get To Know Me profile, a user account, or both.
                        </p>
                    </div>
                    <Link href="/editor/profiles/new" className="btn btn-primary">
                        <Icon name="person_add" />
                        Create profile
                    </Link>
                </div>
                {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
                <div className="overflow-x-auto">
                    <table className="table-zebra table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Position</th>
                                <th>Start date</th>
                                <th>Profile</th>
                                <th>Account</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleAccounts.map((account: IEditorAccount) => (
                                <tr key={account.id}>
                                    <td>
                                        <PersonCell name={account.name} />
                                    </td>
                                    <td>{account.email}</td>
                                    <td>{account.position ?? "—"}</td>
                                    <td>{account.startDate ?? "—"}</td>
                                    <td>
                                        {account.hasProfile ? (
                                            <span className="badge badge-success badge-sm">Has profile</span>
                                        ) : (
                                            <span className="badge badge-ghost badge-sm">No profile</span>
                                        )}
                                    </td>
                                    <td>
                                        {account.hasAccount ? (
                                            <span className="badge badge-success badge-sm">Linked</span>
                                        ) : (
                                            <span className="badge badge-warning badge-sm">Not linked</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            {account.hasProfile ? (
                                                <Link
                                                    href={`/editor/profiles/${account.id}/edit`}
                                                    className="btn btn-ghost btn-sm"
                                                    aria-label={`Edit profile for ${account.name}`}
                                                >
                                                    <Icon name="edit" />
                                                    Edit
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/editor/profiles/new?accountId=${account.id}`}
                                                    className="btn btn-ghost btn-sm"
                                                    aria-label={`Create profile for ${account.name}`}
                                                >
                                                    <Icon name="person_add" />
                                                    Create
                                                </Link>
                                            )}
                                            {account.hasProfile && canDeleteProfiles && (
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm text-error"
                                                    aria-label={`Delete profile for ${account.name}`}
                                                    onClick={() => setPendingDelete(account)}
                                                >
                                                    <Icon name="delete" />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {visibleAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        Nothing matches these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {pendingDelete && (
                <ConfirmDialog
                    title="Delete profile?"
                    message={`This deletes the Get To Know Me profile for ${pendingDelete.name}. ${
                        pendingDelete.hasAccount
                            ? "Their user account is kept."
                            : "They have no user account, so they will no longer appear in this list."
                    }`}
                    confirmLabel="Delete profile"
                    isDestructive
                    onConfirm={confirmDeleteProfile}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
        </>
    );
}
