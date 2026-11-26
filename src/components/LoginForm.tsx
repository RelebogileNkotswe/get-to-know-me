"use client";

import { useActionState, useState } from "react";
import { signInAction, type ISignInFormState } from "../app/login/actions";
import Icon from "./Icon";

const initialState: ISignInFormState = { error: null, email: "" };

const SINGULAR_LOGO =
    "https://lh3.googleusercontent.com/aida/AEtjO1WQW_0Z0aNoWJGIwcOd6v6Yw1Rl7KVFXwdbkI5w6R2ROS1c6ybrs9jmLHCu7vOoR3i3BYFANBP3Rw7b1KEPm2rOGSqQ6Wwsg3NZ3qno0MEZaGvy-Qf8mYR1b82sUEqMqi0jG37sYaqsQnITSw0gcaxSL67aTn8k7ZtTsGjvuwOM8hH27fovps5402n9zMGqQAzg9cc_h2QvHrUgwrmyLCQfTrclhrrtPhs2HxiXfBAduyggp5S6RTS-";

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(signInAction, initialState);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="bg-base-200 flex min-h-screen w-full flex-col items-center justify-center p-4">
            <div className="bg-base-100 border-base-300 border-t-primary rounded-box flex w-full max-w-sm flex-col gap-5 border border-t-4 p-8">
                <div className="flex flex-col items-center gap-0.5 pb-2">
                    <img
                        alt="Singular Systems"
                        className="mb-2 h-10 w-auto object-contain"
                        src={SINGULAR_LOGO}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                    <span className="font-headline text-xl leading-none font-bold tracking-tight">Singular</span>
                    <span className="text-base-content/70 mt-0.5 text-[11px] font-bold tracking-wide uppercase">
                        Get To Know Me
                    </span>
                </div>

                <button type="button" className="btn btn-outline w-full gap-3">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    <span>Continue with Microsoft Outlook</span>
                </button>

                <div className="text-base-content/60 flex items-center gap-3 text-xs">
                    <div className="bg-base-300 h-px flex-1" />
                    <span>or use corporate credentials</span>
                    <div className="bg-base-300 h-px flex-1" />
                </div>

                {state.error && (
                    <div role="alert" className="alert alert-error alert-soft items-start text-xs">
                        <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
                        <span className="leading-relaxed">{state.error}</span>
                    </div>
                )}

                <form action={formAction} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="login-email" className="flex items-center justify-between text-xs font-semibold">
                            <span>Company Email</span>
                            <span className="text-base-content/70 flex items-center gap-1 text-[11px] font-normal">
                                <Icon name="verified" className="text-[13px]" />
                                @singular.co.za
                            </span>
                        </label>
                        <div className="relative flex items-center">
                            <Icon name="mail" className="text-base-content/50 absolute left-3 z-10 text-[16px]" />
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                required
                                autoComplete="username"
                                defaultValue={state.email}
                                placeholder="name@singular.co.za"
                                className="input w-full pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="login-password" className="text-xs font-semibold">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() =>
                                    alert(
                                        "Please contact IT Desk at it-support@singular.co.za or ask an administrator.",
                                    )
                                }
                                className="link text-xs"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative flex items-center">
                            <Icon name="lock" className="text-base-content/50 absolute left-3 z-10 text-[16px]" />
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                className="input w-full pr-10 pl-9"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-base-content/60 hover:text-base-content absolute right-3 z-10"
                                title={showPassword ? "Hide password" : "Show password"}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[16px]" />
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={isPending} className="btn btn-primary mt-1 w-full">
                        {isPending ? (
                            <>
                                <Icon name="sync" className="animate-spin text-[18px]" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>
            </div>

            <p className="text-base-content/60 mt-6 text-xs">
                {String.fromCharCode(169)} {new Date().getFullYear()} Singular Systems (Pty) Ltd.
            </p>
        </div>
    );
}
