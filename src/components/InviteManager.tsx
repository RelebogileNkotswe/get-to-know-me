"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cancelInviteAction, createInviteAction, renewInviteLinkAction } from "../app/editor/invites/actions";
import type { IPendingInvite } from "../models/Invite";
import {
    ALLOWED_EMAIL_DOMAIN,
    emptyProfileForm,
    type IProfileFormValues,
    type ProfileFormErrors,
} from "../models/ProfileForm";
import { profileStatusLabels, ProfileStatus } from "../models/ProfileStatus";
import ActionNotice from "./ActionNotice";
import ConfirmDialog from "./ConfirmDialog";
import DatePicker from "./DatePicker";
import Icon from "./Icon";

interface IInviteManagerProps {
    /** Profiles that are invited or awaiting review, loaded on the server. */
    pendingInvites: IPendingInvite[];
}

interface IShownLink {
    name: string;
    url: string;
}

/**
 * Invites page body for editors and admins: create an invite for a new joiner and copy the private link to send them
 * yourself (nothing is emailed), and see who has been invited and who has submitted and is waiting for review.
 */
export default function InviteManager({ pendingInvites }: IInviteManagerProps) {
    const [values, setValues] = useState<IProfileFormValues>(emptyProfileForm);
    const [errors, setErrors] = useState<ProfileFormErrors>({});
    const [shownLink, setShownLink] = useState<IShownLink | null>(null);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);
    const [pendingCancel, setPendingCancel] = useState<IPendingInvite | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [problem, setProblem] = useState<string | null>(null);
    const [isWorking, startWorking] = useTransition();

    function setValue(name: keyof IProfileFormValues, value: string): void {
        setValues((current: IProfileFormValues) => ({ ...current, [name]: value }));
    }

    /** The link as a full address: this site's own origin plus the private path. */
    function toUrl(linkPath: string): string {
        return `${window.location.origin}${linkPath}`;
    }

    function createInvite(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        setNotice(null);
        setProblem(null);
        startWorking(async () => {
            const result = await createInviteAction(values);
            if (!result.ok) {
                setErrors(result.errors);
                return;
            }
            const name: string = `${values.firstName} ${values.lastName}`.trim() || values.companyEmail;
            setErrors({});
            setValues(emptyProfileForm);
            setCopyMessage(null);
            setShownLink({ name, url: toUrl(result.linkPath) });
        });
    }

    function renewLink(invite: IPendingInvite): void {
        setNotice(null);
        setProblem(null);
        startWorking(async () => {
            const linkPath: string | null = await renewInviteLinkAction(invite.profileId);
            if (linkPath === null) {
                setProblem(`Could not make a new link for ${invite.name}. They may have submitted already.`);
                return;
            }
            setCopyMessage(null);
            setShownLink({ name: invite.name, url: toUrl(linkPath) });
        });
    }

    function confirmCancel(): void {
        if (!pendingCancel) {
            return;
        }
        const invite: IPendingInvite = pendingCancel;
        setPendingCancel(null);
        setNotice(null);
        setProblem(null);
        startWorking(async () => {
            const cancelled: boolean = await cancelInviteAction(invite.profileId);
            if (cancelled) {
                setNotice(`Cancelled the invite for ${invite.name}. Their link no longer works.`);
                setShownLink(null);
            } else {
                setProblem(`Could not cancel the invite for ${invite.name}. They may have submitted already.`);
            }
        });
    }

    async function copyLink(url: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            setCopyMessage("Copied.");
        } catch {
            setCopyMessage("Could not copy automatically. Select the link and copy it.");
        }
    }

    function renderField(
        name: keyof IProfileFormValues,
        legend: string,
        options: { type?: string; hint?: string } = {},
    ) {
        const id = `invite-field-${name}`;
        const error: string | undefined = errors[name];
        return (
            <div className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-xs font-semibold text-base-content/70">
                    {legend}
                </label>
                <input
                    id={id}
                    type={options.type ?? "text"}
                    className={`input w-full ${error ? "input-error" : ""}`}
                    value={values[name]}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value)}
                />
                {(error || options.hint) && (
                    <p className={`text-xs ${error ? "text-error" : "text-base-content/50"}`}>
                        {error ?? options.hint}
                    </p>
                )}
            </div>
        );
    }

    const awaitingReview: IPendingInvite[] = pendingInvites.filter(
        (invite: IPendingInvite) => invite.status === ProfileStatus.AwaitingReview,
    );

    return (
        <div className="flex flex-col gap-8 p-6">
            <div>
                <h1 className="text-2xl font-bold text-base-content">Invite a new joiner</h1>
                <p className="text-base-content/70 mt-1.5 max-w-2xl text-sm">
                    Create an invite, then copy the private link and send it to them yourself. They fill in their own
                    profile without signing in, and you review it here before it is published.
                </p>
            </div>

            {awaitingReview.length > 0 && (
                <div role="status" className="alert alert-info alert-soft max-w-3xl">
                    <Icon name="rate_review" />
                    <span>
                        {awaitingReview.length === 1
                            ? "1 profile is waiting for your review."
                            : `${awaitingReview.length} profiles are waiting for your review.`}
                    </span>
                </div>
            )}

            <div className="bg-base-200 border border-base-300 rounded-2xl overflow-hidden max-w-3xl">
                <div className="px-6 py-4 border-b border-base-300 flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-brand-green/15 text-brand-green">
                        <Icon name="person_add" />
                    </span>
                    <h2 className="font-semibold text-base-content">New invite</h2>
                </div>

                <form onSubmit={createInvite} noValidate className="p-6 flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {renderField("firstName", "First name")}
                        {renderField("lastName", "Last name")}
                        {renderField("companyEmail", "Company email *", {
                            type: "email",
                            hint: `Required. Must end in ${ALLOWED_EMAIL_DOMAIN}. It links their profile to their account, so check it carefully.`,
                        })}
                        {renderField("position", "Position")}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-base-content/70">Start date</span>
                            <DatePicker
                                label="Select start date"
                                valueOnly
                                value={values.startDate}
                                onChange={(value: string) => setValue("startDate", value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button type="submit" className="btn btn-primary" disabled={isWorking}>
                            <Icon name="link" />
                            {isWorking ? "Working..." : "Create invite link"}
                        </button>
                    </div>
                </form>
            </div>

            {shownLink && (
                <section
                    className="bg-base-200 border border-primary/30 rounded-2xl p-6 max-w-3xl"
                    aria-label="Invite link"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-green/15 text-brand-green">
                            <Icon name="link" />
                        </span>
                        <h2 className="font-semibold text-base-content">Link for {shownLink.name}</h2>
                    </div>
                    <p className="text-base-content/50 text-xs mb-4">
                        Copy this link and send it to them. It works for 14 days and only until they submit. For safety
                        it is shown here only now — if you lose it, make a new link, which stops the old one working.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="text"
                            readOnly
                            className="input min-w-0 flex-1"
                            aria-label="Invite link"
                            value={shownLink.url}
                            onFocus={(event: React.FocusEvent<HTMLInputElement>) => event.target.select()}
                        />
                        <button
                            type="button"
                            className="btn btn-primary shrink-0"
                            onClick={() => void copyLink(shownLink.url)}
                        >
                            <Icon name="content_copy" />
                            Copy link
                        </button>
                    </div>
                    {copyMessage && (
                        <p role="status" className="text-xs text-success mt-2">
                            {copyMessage}
                        </p>
                    )}
                </section>
            )}

            {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
            {problem && (
                <div role="alert" className="alert alert-error alert-soft max-w-3xl">
                    <Icon name="error" />
                    <span>{problem}</span>
                </div>
            )}

            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-base-content">Invited and waiting for review</h2>
                    {pendingInvites.length > 0 && (
                        <span className="text-xs text-base-content/40">
                            {pendingInvites.length} {pendingInvites.length === 1 ? "person" : "people"}
                        </span>
                    )}
                </div>

                {pendingInvites.length === 0 ? (
                    <div className="bg-base-200 border border-base-300 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
                        <span className="flex size-12 items-center justify-center rounded-full bg-base-300/50 text-base-content/30">
                            <Icon name="mail" className="text-[24px]" />
                        </span>
                        <p className="text-sm text-base-content/40">No invites yet.</p>
                        <p className="text-xs text-base-content/30">Create your first invite above.</p>
                    </div>
                ) : (
                    <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-base-300 text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                                        <th className="text-left px-5 py-3">Name</th>
                                        <th className="text-left px-5 py-3">Email</th>
                                        <th className="text-left px-5 py-3">Position</th>
                                        <th className="text-left px-5 py-3">Status</th>
                                        <th className="text-left px-5 py-3">Link / submitted</th>
                                        <th className="px-5 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingInvites.map((invite: IPendingInvite) => (
                                        <tr
                                            key={invite.profileId}
                                            className="border-b border-base-300/50 hover:bg-base-300/30 transition-colors"
                                        >
                                            <td className="px-5 py-3 font-medium text-base-content">{invite.name}</td>
                                            <td className="px-5 py-3 text-base-content/60">{invite.email}</td>
                                            <td className="px-5 py-3 text-base-content/60">{invite.position ?? "—"}</td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`badge badge-sm ${invite.status === ProfileStatus.AwaitingReview ? "badge-warning" : "badge-ghost"}`}
                                                >
                                                    {profileStatusLabels[invite.status]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-base-content/50 text-xs">
                                                {invite.status === ProfileStatus.AwaitingReview ? (
                                                    `Submitted ${invite.submittedOn ?? ""}`
                                                ) : invite.isExpired ? (
                                                    <span className="text-error">Expired {invite.expiresOn}</span>
                                                ) : (
                                                    `Valid until ${invite.expiresOn}`
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap items-center gap-1 justify-end">
                                                    {invite.status === ProfileStatus.AwaitingReview ? (
                                                        <Link
                                                            href={`/editor/profiles/${invite.profileId}/edit`}
                                                            className="btn btn-primary btn-sm"
                                                            aria-label={`Review the profile for ${invite.name}`}
                                                        >
                                                            <Icon name="rate_review" />
                                                            Review
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-sm"
                                                                disabled={isWorking}
                                                                aria-label={`Make a new link for ${invite.name}`}
                                                                onClick={() => renewLink(invite)}
                                                            >
                                                                <Icon name="autorenew" />
                                                                New link
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-sm text-error"
                                                                disabled={isWorking}
                                                                aria-label={`Cancel the invite for ${invite.name}`}
                                                                onClick={() => setPendingCancel(invite)}
                                                            >
                                                                <Icon name="cancel" />
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>

            {pendingCancel && (
                <ConfirmDialog
                    title="Cancel invite?"
                    message={`${pendingCancel.name}'s link will stop working and their empty profile will be removed.`}
                    confirmLabel="Cancel invite"
                    isDestructive
                    onConfirm={confirmCancel}
                    onCancel={() => setPendingCancel(null)}
                />
            )}
        </div>
    );
}
