"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
    cancelInviteAction,
    createInviteAction,
    renewInviteLinkAction,
} from "../app/editor/invites/actions";
import type { IPendingInvite } from "../models/Invite";
import { ALLOWED_EMAIL_DOMAIN, emptyProfileForm, type IProfileFormValues, type ProfileFormErrors } from "../models/ProfileForm";
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

    /** The link as a full address: this site's own address plus the private path. */
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

    function renderField(name: keyof IProfileFormValues, legend: string, options: { type?: string; hint?: string } = {}) {
        const error: string | undefined = errors[name];
        return (
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{legend}</legend>
                <input
                    type={options.type ?? "text"}
                    className={`input w-full ${error ? "input-error" : ""}`}
                    aria-label={legend}
                    value={values[name]}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value)}
                />
                {(error || options.hint) && <p className={`label ${error ? "text-error" : ""}`}>{error ?? options.hint}</p>}
            </fieldset>
        );
    }

    const awaitingReview: IPendingInvite[] = pendingInvites.filter((invite: IPendingInvite) => invite.status === ProfileStatus.AwaitingReview);

    return (
        <div className="flex flex-col gap-8 p-6">
            <div>
                <h1 className="text-2xl font-semibold">Invite a new joiner</h1>
                <p className="text-base-content/70 mt-2 max-w-2xl">
                    Create an invite, then copy the private link and send it to them yourself. They fill in their own profile
                    without signing in, and you review it here before it is published.
                </p>
            </div>

            {awaitingReview.length > 0 && (
                <div role="status" className="alert alert-info alert-soft">
                    <span>
                        {awaitingReview.length === 1
                            ? "1 profile is waiting for your review."
                            : `${awaitingReview.length} profiles are waiting for your review.`}
                    </span>
                </div>
            )}

            <form onSubmit={createInvite} noValidate className="flex max-w-3xl flex-col gap-2">
                <h2 className="text-lg font-semibold">New invite</h2>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    {renderField("firstName", "First name")}
                    {renderField("lastName", "Last name")}
                    {renderField("companyEmail", "Company email *", {
                        type: "email",
                        hint: `Required. Must end in ${ALLOWED_EMAIL_DOMAIN}. It links their profile to their account, so check it carefully.`,
                    })}
                    {renderField("position", "Position")}
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Start date</legend>
                        <div>
                            <DatePicker
                                label="Select start date"
                                valueOnly
                                value={values.startDate}
                                onChange={(value: string) => setValue("startDate", value)}
                            />
                        </div>
                    </fieldset>
                </div>
                <div>
                    <button type="submit" className="btn btn-primary" disabled={isWorking}>
                        <Icon name="link" />
                        {isWorking ? "Working..." : "Create invite link"}
                    </button>
                </div>
            </form>

            {shownLink && (
                <section className="bg-base-200 rounded-box flex max-w-3xl flex-col gap-2 p-4" aria-label="Invite link">
                    <h2 className="font-semibold">Link for {shownLink.name}</h2>
                    <p className="text-base-content/70 text-sm">
                        Copy this link and send it to them. It works for 14 days and only until they submit. For safety it is
                        shown here only now; if you lose it, make a new link, which stops the old one working.
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
                        <button type="button" className="btn btn-primary" onClick={() => void copyLink(shownLink.url)}>
                            <Icon name="content_copy" />
                            Copy link
                        </button>
                    </div>
                    {copyMessage && (
                        <p role="status" className="text-sm">
                            {copyMessage}
                        </p>
                    )}
                </section>
            )}

            {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
            {problem && (
                <div role="alert" className="alert alert-error alert-soft">
                    <span>{problem}</span>
                </div>
            )}

            <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Invited and waiting for review</h2>
                <div className="overflow-x-auto">
                    <table className="table-zebra table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Link / submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingInvites.map((invite: IPendingInvite) => (
                                <tr key={invite.profileId}>
                                    <td>{invite.name}</td>
                                    <td>{invite.email}</td>
                                    <td>{invite.position ?? "—"}</td>
                                    <td>
                                        <span
                                            className={`badge badge-sm ${invite.status === ProfileStatus.AwaitingReview ? "badge-warning" : "badge-ghost"}`}
                                        >
                                            {profileStatusLabels[invite.status]}
                                        </span>
                                    </td>
                                    <td>
                                        {invite.status === ProfileStatus.AwaitingReview
                                            ? `Submitted ${invite.submittedOn ?? ""}`
                                            : invite.isExpired
                                              ? `Expired ${invite.expiresOn}`
                                              : `Valid until ${invite.expiresOn}`}
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap items-center gap-1">
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
                            {pendingInvites.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center">
                                        No invites yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
