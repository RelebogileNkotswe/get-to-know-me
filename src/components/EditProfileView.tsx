"use client";

import Link from "next/link";
import { useState } from "react";
import type { IAccountStatus } from "../interface/profiles/ProfileService";
import { authService } from "../logic/auth/AuthService";
import type { IProfileFormValues } from "../models/ProfileForm";
import { hasRoleAtLeast } from "../models/UserRole";
import ActionNotice from "./ActionNotice";
import ConfirmDialog from "./ConfirmDialog";
import Icon from "./Icon";
import ProfileForm from "./ProfileForm";

type PendingAction = "delete-profile" | "block" | "delete-account";

interface IEditProfileViewProps {
    profile: IProfileFormValues;
    accountStatus: IAccountStatus;
    currentPhotoUrl?: string;
}

/**
 * Edit profile page body: the profile form plus the actions available for this person, depending on
 * the signed-in role and on the state of their account.
 */
export default function EditProfileView({ profile, accountStatus, currentPhotoUrl }: IEditProfileViewProps) {
    const role = authService.getCurrentRole();
    const canDeleteProfile: boolean = hasRoleAtLeast(role, "editor");
    const canManageAccount: boolean = hasRoleAtLeast(role, "admin");

    const [account, setAccount] = useState<IAccountStatus>(accountStatus);
    const [isProfileDeleted, setIsProfileDeleted] = useState<boolean>(false);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const name: string = `${profile.firstName} ${profile.lastName}`.trim();

    // TODO: the actions below only change the state on this page until the API exists.
    function unlockAccount(): void {
        setAccount((current: IAccountStatus) => ({ ...current, isLocked: false }));
        setNotice(`Unlocked the account for ${name}.`);
    }

    function confirmPendingAction(): void {
        if (pending === "block") {
            setAccount((current: IAccountStatus) => ({ ...current, isLocked: true }));
            setNotice(`Blocked the account for ${name}.`);
        } else if (pending === "delete-account") {
            setAccount({ hasAccount: false, isLocked: false });
            setNotice(`Deleted the user account for ${name}.`);
        } else if (pending === "delete-profile") {
            setIsProfileDeleted(true);
            setNotice(null);
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
                    <h1 className="text-2xl font-semibold">Edit profile</h1>
                    <p className="text-base-content/70 mt-2">Update the details for {name}.</p>
                </div>
                {!isProfileDeleted && (
                    <div className="flex flex-wrap items-center gap-2">
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
                <ProfileForm mode="edit" initialValues={profile} currentPhotoUrl={currentPhotoUrl} />
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
