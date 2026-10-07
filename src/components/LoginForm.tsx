"use client";

import { useActionState } from "react";
import { signInAction, type ISignInFormState } from "../app/login/actions";

const initialState: ISignInFormState = { error: null, email: "" };

/**
 * Sign-in form: company email and password. A failed attempt shows one message that does not say which part was wrong.
 */
export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(signInAction, initialState);

    return (
        <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">Company email</legend>
                <input
                    type="email"
                    name="email"
                    className="input w-full"
                    placeholder="name@singular.co.za"
                    autoComplete="username"
                    defaultValue={state.email}
                    required
                />
            </fieldset>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">Password</legend>
                <input
                    type="password"
                    name="password"
                    className="input w-full"
                    autoComplete="current-password"
                    required
                />
            </fieldset>
            {state.error && (
                <div role="alert" className="alert alert-error alert-soft">
                    <span>{state.error}</span>
                </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}
