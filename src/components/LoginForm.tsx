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
        <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-surface-container border border-outline-variant/40 rounded-xl p-8 flex flex-col gap-5 shadow-lg">
                <div className="flex flex-col items-center gap-0.5 pb-2">
                    <img
                        alt="Singular Systems"
                        className="h-10 w-auto object-contain mb-2"
                        src={SINGULAR_LOGO}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                    <span className="font-headline text-xl font-bold text-white tracking-tight leading-none">
                        Singular
                    </span>
                    <span className="text-[11px] font-bold text-brand-green uppercase tracking-wide mt-0.5">
                        Get To Know Me
                    </span>
                </div>

                <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface text-sm font-semibold hover:border-brand-green/50 hover:bg-surface-container transition-colors cursor-pointer"
                >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                    </svg>
                    <span>Continue with Microsoft Outlook</span>
                </button>

                <div className="flex items-center gap-3 text-xs text-outline">
                    <div className="flex-1 h-px bg-outline-variant/40" />
                    <span>or use corporate credentials</span>
                    <div className="flex-1 h-px bg-outline-variant/40" />
                </div>

                {state.error && (
                    <div
                        role="alert"
                        className="p-3 rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-2 text-xs text-error"
                    >
                        <Icon name="error" className="text-[16px] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{state.error}</span>
                    </div>
                )}

                <form action={formAction} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                            <span>Company Email</span>
                            <span className="text-[11px] text-brand-green flex items-center gap-1">
                                <Icon name="verified" className="text-[13px]" />
                                @singular.co.za
                            </span>
                        </label>
                        <div className="relative flex items-center">
                            <Icon name="mail" className="text-[16px] text-outline absolute left-3" />
                            <input
                                type="email"
                                name="email"
                                required
                                autoComplete="username"
                                defaultValue={state.email}
                                placeholder="name@singular.co.za"
                                className="w-full bg-surface-container-high border border-outline-variant/40 pl-9 pr-4 py-2.5 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-brand-green transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-on-surface">Password</label>
                            <button
                                type="button"
                                onClick={() =>
                                    alert(
                                        "Please contact IT Desk at it-support@singular.co.za or ask an administrator.",
                                    )
                                }
                                className="text-xs text-brand-green hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative flex items-center">
                            <Icon name="lock" className="text-[16px] text-outline absolute left-3" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                className="w-full bg-surface-container-high border border-outline-variant/40 pl-9 pr-10 py-2.5 rounded-lg text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-brand-green transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-outline hover:text-on-surface"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[16px]" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-green text-brand-navy font-bold text-sm hover:brightness-90 transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Icon name="sync" className="text-[18px] animate-spin" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>
            </div>

            <p className="mt-6 text-xs text-outline">
                {String.fromCharCode(169)} {new Date().getFullYear()} Singular Systems (Pty) Ltd.
            </p>
        </div>
    );
}
