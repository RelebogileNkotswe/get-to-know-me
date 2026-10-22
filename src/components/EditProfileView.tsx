"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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

    // TODO: unlock, block and delete account only change the state on this page until the account API exists.
    function unlockAccount(): void {
        setAccount((current: IAccountStatus) => ({ ...current, isLocked: false }));
        setNotice(`Unlocked the account for ${name}.`);
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
        if (pending === "block") {
            setAccount((current: IAccountStatus) => ({ ...current, isLocked: true }));
            setNotice(`Blocked the account for ${name}.`);
        } else if (pending === "delete-account") {
            setAccount({ hasAccount: false, isLocked: false });
            setNotice(`Deleted the user account for ${name}.`);
        } else if (pending === "delete-profile") {
            void deleteProfile();
        }
        setPending(null);
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
                            className={`badge ${status === ProfileStatus.Published ? "badge-success" : "badge-warning"}`}
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
                            <span className={`badge ${account.isLocked ? "badge-error" : "badge-success"}`}>
                                Account {account.isLocked ? "locked" : "active"}
                            </span>
                        )}
                        {canManageAccount && account.hasAccount && account.isLocked && (
                            <button type="button" className="btn btn-outline btn-sm" onClick={unlockAccount}>
                                <Icon name="lock_open" />
                                Unlock
                            </button>
                        )}
                        {canManageAccount && account.hasAccount && !account.isLocked && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm"
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
