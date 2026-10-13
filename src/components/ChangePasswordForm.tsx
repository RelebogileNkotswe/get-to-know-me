"use client";

import { useActionState } from "react";
import { changePasswordAction, type IChangePasswordFormState } from "../app/profile/actions";
import { MIN_PASSWORD_LENGTH } from "../models/Password";

const initialState: IChangePasswordFormState = { errors: {}, isSaved: false };

interface IPasswordFieldProps {
    name: string;
    legend: string;
    autoComplete: string;
    error?: string;
    hint?: string;
}

function PasswordField({ name, legend, autoComplete, error, hint }: IPasswordFieldProps) {
    return (
        <fieldset className="fieldset">
            <legend className="fieldset-legend">{legend}</legend>
            <input
                type="password"
                name={name}
                className={`input w-full ${error ? "input-error" : ""}`}
                autoComplete={autoComplete}
                required
            />
            {(error || hint) && <p className={`label ${error ? "text-error" : ""}`}>{error ?? hint}</p>}
        </fieldset>
    );
}

/**
 * Form for the signed-in user to change their own password. The server checks the current password and the new
 * password's rules, so the checks here only help the user.
 */
export default function ChangePasswordForm() {
    const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

    return (
        <form action={formAction} className="flex max-w-md flex-col gap-2">
            <h2 className="text-lg font-semibold">Change your password</h2>
            <PasswordField
                name="currentPassword"
                legend="Current password"
                autoComplete="current-password"
                error={state.errors.currentPassword}
            />
            <PasswordField
                name="newPassword"
                legend="New password"
                autoComplete="new-password"
                error={state.errors.newPassword}
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            />
            <PasswordField
                name="confirmPassword"
                legend="Confirm new password"
                autoComplete="new-password"
                error={state.errors.confirmPassword}
            />
            {state.isSaved && (
                <div role="status" className="alert alert-success alert-soft">
                    <span>Your password was changed. Other browsers where you were signed in were signed out.</span>
                </div>
            )}
            <div>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                    {isPending ? "Saving..." : "Change password"}
                </button>
            </div>
        </form>
    );
}
