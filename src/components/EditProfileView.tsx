"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteUserAction, lockUserAction, unlockUserAction } from "../app/admin/actions";
import { deleteProfileAction, publishProfileAction } from "../app/editor/profiles/actions";
import type { IAccountStatus } from "../interface/profiles/ProfileService";
import type { IProfileFormValues } from "../models/ProfileForm";
import { profileStatusLabels, ProfileStatus } from "../models/ProfileStatus";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";
import ActionNotice from "./ActionNotice";
import ConfirmDialog from "./ConfirmDialog";
import { useCurrentRole } from "./CurrentUserProvider";
import Icon from "./Icon";
import ProfileForm from "./ProfileForm";

type PendingAction = "delete-profile" | "block" | "delete-account";

interface IEditProfileViewProps {
    profileId: string;
    profile: IProfileFormValues;
    /** Where the profile is: invited, awaiting review (submitted by the employee) or published. */
    status: ProfileStatus;
    accountStatus: IAccountStatus;
    currentPhotoUrl?: string;
}

/**
 * Edit profile page body: the profile form plus the actions available for this person, depending on
 * the signed-in role and on the state of their account.
 */
export default function EditProfileView({
    profileId,
    profile,
    status: initialStatus,
    accountStatus,
    currentPhotoUrl,
}: IEditProfileViewProps) {
    const role = useCurrentRole();
    const canDeleteProfile: boolean = hasRoleAtLeast(role, UserRole.Editor);
    const canManageAccount: boolean = hasRoleAtLeast(role, UserRole.Admin);

    const [account, setAccount] = useState<IAccountStatus>(accountStatus);
    const [isProfileDeleted, setIsProfileDeleted] = useState<boolean>(false);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [status, setStatus] = useState<ProfileStatus>(initialStatus);
    const [isAccountActionRunning, setIsAccountActionRunning] = useState<boolean>(false);
    const [isPublishing, startPublishing] = useTransition();

    const name: string = `${profile.firstName} ${profile.lastName}`.trim();

    function publishProfile(): void {
        startPublishing(async () => {
            const published: boolean = await publishProfileAction(profileId);
            if (published) {
                setStatus(ProfileStatus.Published);
                setNotice(`Published the profile for ${name}. It now shows in the employee list.`);
            } else {
                setNotice(`Could not publish the profile for ${name}. It may already be published.`);
            }
        });
    }

    async function unlockAccount(): Promise<void> {
        if (!account.userId) return;
        setIsAccountActionRunning(true);
        const result = await unlockUserAction(account.userId);
        setIsAccountActionRunning(false);
        if (result.ok) {
            setAccount((current: IAccountStatus) => ({ ...current, isLocked: false }));
            setNotice(`Unlocked the account for ${name}.`);
        } else {
            setNotice(`Could not unlock the account for ${name}. ${result.error}`);
        }
    }

    async function blockAccount(): Promise<void> {
        if (!account.userId) return;
        setIsAccountActionRunning(true);
        const result = await lockUserAction(account.userId);
        setIsAccountActionRunning(false);
        if (result.ok) {
            setAccount((current: IAccountStatus) => ({ ...current, isLocked: true }));
            setNotice(`Blocked the account for ${name}.`);
        } else {
            setNotice(`Could not block the account for ${name}. ${result.error}`);
        }
    }

    async function deleteAccount(): Promise<void> {
        if (!account.userId) return;
        setIsAccountActionRunning(true);
        const result = await deleteUserAction(account.userId);
        setIsAccountActionRunning(false);
        if (result.ok) {
            setAccount({ hasAccount: false, isLocked: false, userId: undefined });
            setNotice(`Deleted the user account for ${name}.`);
        } else {
            setNotice(`Could not delete the account for ${name}. ${result.error}`);
        }
    }

    async function deleteProfile(): Promise<void> {
        const deleted: boolean = await deleteProfileAction(profileId);
        if (deleted) {
            setIsProfileDeleted(true);
            setNotice(null);
        } else {
            setNotice(
                `Could not delete the profile for ${name}. It may already be deleted, or you may not be allowed.`,
            );
        }
    }

    function confirmPendingAction(): void {
        const action = pending;
        setPending(null);
        if (action === "block") void blockAccount();
        else if (action === "delete-account") void deleteAccount();
        else if (action === "delete-profile") void deleteProfile();
    }

    function dialogTitle(): string {
        if (pending === "block") {
            return "Block account?";
        }
        return pending === "delete-account" ? "Delete account?" : "Delete profile?";
    }

    function dialogMessage(): string {
        if (pending === "block") {
            return `${name} will not be able to sign in until an admin unlocks the account.`;
        }
        if (pending === "delete-account") {
            return `This deletes the user account for ${name}. It cannot be undone.`;
        }
        return `This deletes the Get To Know Me profile for ${name}. ${
            account.hasAccount ? "Their user account is kept." : "They have no user account."
        }`;
    }

    function dialogConfirmLabel(): string {
        if (pending === "block") {
            return "Block account";
        }
        return pending === "delete-account" ? "Delete account" : "Delete profile";
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">
                        {status === ProfileStatus.AwaitingReview ? "Review profile" : "Edit profile"}
                    </h1>
                    <p className="text-base-content/70 mt-2">
                        {status === ProfileStatus.AwaitingReview
                            ? `${name} has submitted their details. Change anything that needs it, save, then publish.`
                            : `Update the details for ${name}.`}
                    </p>
                </div>
                {!isProfileDeleted && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`btn btn-sm no-animation pointer-events-none select-none ${status === ProfileStatus.Published ? "btn-success" : "btn-warning"}`}
                        >
                            {profileStatusLabels[status]}
                        </span>
                        {status === ProfileStatus.AwaitingReview && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={isPublishing}
                                onClick={publishProfile}
                            >
                                <Icon name="publish" />
                                {isPublishing ? "Publishing..." : "Publish"}
                            </button>
                        )}
                        {account.hasAccount && (
                            <span
                                className={`btn btn-sm no-animation pointer-events-none select-none ${account.isLocked ? "btn-error" : "btn-success"}`}
                            >
                                Account {account.isLocked ? "locked" : "active"}
                            </span>
                        )}
                        {canManageAccount && account.hasAccount && account.isLocked && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={isAccountActionRunning}
                                onClick={() => void unlockAccount()}
                            >
                                <Icon name="lock_open" />
                                Unlock
                            </button>
                        )}
                        {canManageAccount && account.hasAccount && !account.isLocked && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={isAccountActionRunning}
                                onClick={() => setPending("block")}
                            >
                                <Icon name="block" />
                                Block
                            </button>
                        )}
                        {canManageAccount && account.hasAccount && (
                            <button
                                type="button"
                                className="btn btn-outline btn-error btn-sm"
                                disabled={isAccountActionRunning}
                                onClick={() => setPending("delete-account")}
                            >
                                <Icon name="person_remove" />
                                Delete account
                            </button>
                        )}
                        {canDeleteProfile && (
                            <button
                                type="button"
                                className="btn btn-outline btn-error btn-sm"
                                onClick={() => setPending("delete-profile")}
                            >
                                <Icon name="delete" />
                                Delete profile
                            </button>
                        )}
                    </div>
                )}
            </div>
            {notice && <ActionNotice message={notice} onDismiss={() => setNotice(null)} />}
            {isProfileDeleted ? (
                <div className="flex max-w-3xl flex-col items-start gap-4">
                    <div role="status" className="alert alert-success alert-soft w-full">
                        <span>Deleted the Get To Know Me profile for {name}.</span>
                    </div>
                    <Link href="/editor" className="btn btn-primary">
                        Back to the list
                    </Link>
                </div>
            ) : (
                <ProfileForm
                    mode="edit"
                    profileId={profileId}
                    initialValues={profile}
                    currentPhotoUrl={currentPhotoUrl}
                />
            )}
            {pending && (
                <ConfirmDialog
                    title={dialogTitle()}
                    message={dialogMessage()}
                    confirmLabel={dialogConfirmLabel()}
                    isDestructive
                    onConfirm={confirmPendingAction}
                    onCancel={() => setPending(null)}
                />
            )}
        </div>
    );
}
