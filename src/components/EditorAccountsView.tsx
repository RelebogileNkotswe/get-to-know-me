"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteProfileAction } from "../app/editor/profiles/actions";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";
import { profileStatusLabels, ProfileStatus } from "../models/ProfileStatus";
import {
    emptyEditorAccountFilter,
    editorAccountListPath,
    type AccountStatusFilter,
    type IEditorAccount,
    type IEditorAccountFilter,
} from "../models/EditorAccount";
import type { IPage } from "../models/Paging";
import ActionNotice from "./ActionNotice";
import ConfirmDialog from "./ConfirmDialog";
import { useCurrentRole } from "./CurrentUserProvider";
import EditorToolbar from "./EditorToolbar";
import Icon from "./Icon";
import Pagination from "./Pagination";
import PersonCell from "./PersonCell";
import { useServerFilter, type IServerFilter } from "./ServerFilter";

interface IEditorAccountsViewProps {
    /** One page of the profiles and accounts that match the filter, loaded on the server. */
    accounts: IPage<IEditorAccount>;
    /** The filter the list was loaded with, read from the page address. */
    filter: IEditorAccountFilter;
}

/**
 * Editor page body: the toolbar plus a page of accounts and their profile and account status. The server filters and
 * pages the list; the filter and page live in the page address.
 */
export default function EditorAccountsView({ accounts, filter }: IEditorAccountsViewProps) {
    const { inputs, isLoading, typeText, choose, clear }: IServerFilter<IEditorAccountFilter> = useServerFilter(
        filter,
        editorAccountListPath,
        emptyEditorAccountFilter,
    );
    const [pendingDelete, setPendingDelete] = useState<IEditorAccount | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [isDeleting, startDeleting] = useTransition();

    const canDeleteProfiles: boolean = hasRoleAtLeast(useCurrentRole(), UserRole.Editor);

    function confirmDeleteProfile(): void {
        if (!pendingDelete) {
            return;
        }
        const target: IEditorAccount = pendingDelete;
        setPendingDelete(null);
        setNotice(null);
        // The action refreshes this page, so the list reloads from the server once the profile is deleted.
        startDeleting(async () => {
            const deleted: boolean = await deleteProfileAction(target.id);
            setNotice(
                deleted
                    ? `Deleted the Get To Know Me profile for ${target.name}.`
                    : `Could not delete the profile for ${target.name}. It may already be deleted, or you may not be allowed.`,
            );
        });
    }

    return (
        <>
            <EditorToolbar
                search={inputs.search}
                onSearchChange={(search: string) => typeText("search", search)}
                status={inputs.status}
                onStatusChange={(status: AccountStatusFilter) => choose("status", status)}
                startDate={inputs.startedFrom}
                onStartDateChange={(startedFrom: string) => choose("startedFrom", startedFrom)}
                onClear={clear}
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
                <div
                    aria-busy={isLoading}
                    className={`overflow-x-auto transition-opacity ${isLoading ? "opacity-60" : ""}`}
                >
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
                            {accounts.items.map((account: IEditorAccount) => (
                                <tr key={account.id}>
                                    <td>
                                        <PersonCell name={account.name} />
                                    </td>
                                    <td>{account.email}</td>
                                    <td>{account.position ?? "—"}</td>
                                    <td>{account.startDate ?? "—"}</td>
                                    <td>
                                        {account.hasProfile ? (
                                            account.profileStatus === ProfileStatus.Published ||
                                            account.profileStatus === null ? (
                                                <span className="badge badge-success badge-sm">Has profile</span>
                                            ) : (
                                                <span className="badge badge-warning badge-sm">
                                                    {profileStatusLabels[account.profileStatus]}
                                                </span>
                                            )
                                        ) : (
                                            <span className="badge badge-ghost badge-sm">No profile</span>
                                        )}
                                        {account.profileRequested && (
                                            <span className="badge badge-info badge-sm ml-1">Requested</span>
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
                                                    disabled={isDeleting}
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
                            {accounts.items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        Nothing matches these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={accounts.page}
                    pageSize={accounts.pageSize}
                    totalCount={accounts.totalCount}
                    itemLabel="people"
                    onPageChange={(page: number) => choose("page", page)}
                    onPageSizeChange={(pageSize: number) => choose("pageSize", pageSize)}
                />
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
