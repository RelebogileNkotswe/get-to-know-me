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
        if (!pendingDelete) return;
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

            <div className="p-6 flex flex-col gap-6">

                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Create/edit profile</h1>
                        <p className="text-white/50 mt-1.5 text-sm">
                            Everyone with a Get To Know Me profile, a user account, or both.
                        </p>
                    </div>
                    <Link
                        href="/editor/profiles/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-green text-brand-navy font-bold text-sm hover:brightness-90 transition-all active:scale-[0.99]"
                    >
                        <Icon name="person_add" />
                        Create profile
                    </Link>
                </div>

                {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}

                {/* Accounts table card */}
                {accounts.items.length === 0 ? (
                    <div className="bg-brand-navy-light border border-white/10 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/5 text-white/30">
                            <Icon name="people" className="text-[24px]" />
                        </span>
                        <p className="text-sm text-white/40">No accounts match these filters.</p>
                    </div>
                ) : (
                    <div className="bg-brand-navy-light border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-[10px] font-bold text-outline uppercase tracking-wider">
                                    <th className="text-left px-5 py-3">Name</th>
                                    <th className="text-left px-5 py-3">Email</th>
                                    <th className="text-left px-5 py-3">Position</th>
                                    <th className="text-left px-5 py-3">Start date</th>
                                    <th className="text-left px-5 py-3">Profile</th>
                                    <th className="text-left px-5 py-3">Account</th>
                                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.items.map((account: IEditorAccount) => (
                                    <tr key={account.id} className="border-b border-white/5 hover:bg-brand-navy/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <PersonCell name={account.name} />
                                        </td>
                                        <td className="px-5 py-3 text-white/60">{account.email}</td>
                                        <td className="px-5 py-3 text-white/60">{account.position ?? "—"}</td>
                                        <td className="px-5 py-3 text-white/60">{account.startDate ?? "—"}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {account.hasProfile ? (
                                                    account.profileStatus === ProfileStatus.Published || account.profileStatus === null ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-green/15 text-brand-green border border-brand-green/25">
                                                            Has profile
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                                            {profileStatusLabels[account.profileStatus]}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-white/40 border border-white/10">
                                                        No profile
                                                    </span>
                                                )}
                                                {account.profileRequested && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                                                        Requested
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            {account.hasAccount ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-green/15 text-brand-green border border-brand-green/25">
                                                    Linked

                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                                    Not linked
                                                </span>
                                            )}

                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1 justify-end">
                                                {account.hasProfile ? (
                                                    <>
                                                        <Link
                                                            href={`/editor/profiles/${account.id}/edit`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5 hover:text-white transition-all"
                                                            aria-label={`Edit profile for ${account.name}`}
                                                        >
                                                            <Icon name="edit" />
                                                            Edit
                                                        </Link>
                                                        {canDeleteProfiles && (
                                                            <button
                                                                type="button"
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error/20 text-error/70 text-xs font-semibold hover:bg-error/10 hover:text-error hover:border-error/40 transition-all"
                                                                aria-label={`Delete profile for ${account.name}`}
                                                                onClick={() => setPendingDelete(account)}
                                                            >
                                                                <Icon name="delete" />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Link
                                                        href={`/editor/profiles/new?accountId=${account.id}`}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-green/20 text-brand-green/70 text-xs font-semibold hover:bg-brand-green/10 hover:text-brand-green hover:border-brand-green/40 transition-all"
                                                        aria-label={`Create profile for ${account.name}`}
                                                    >
                                                        <Icon name="person_add" />
                                                        Create
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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
