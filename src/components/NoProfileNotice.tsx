"use client";

import { useState, useTransition } from "react";
import { requestProfileAction } from "../app/profile/actions";
import Icon from "./Icon";

interface INoProfileNoticeProps {
    /** True when the user already asked for a profile. */
    alreadyRequested: boolean;
}

/**
 * Shown to a signed-in user whose email matches no profile. There are no email alerts, so asking for a profile
 * puts them on the list of accounts without a profile that editors and admins see in the app.
 */
export default function NoProfileNotice({ alreadyRequested }: INoProfileNoticeProps) {
    const [isRequested, setIsRequested] = useState<boolean>(alreadyRequested);
    const [failed, setFailed] = useState<boolean>(false);
    const [isPending, startRequest] = useTransition();

    function requestProfile(): void {
        setFailed(false);
        startRequest(async () => {
            const recorded: boolean = await requestProfileAction();
            setIsRequested(recorded);
            setFailed(!recorded);
        });
    }

    return (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-green/20 bg-brand-green/5 px-6 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="info" className="text-[16px] text-brand-green shrink-0" />
                <p className="text-sm text-white/70">
                    {isRequested
                        ? "Your profile request has been sent — an editor will create it for you."
                        : "You don't have a profile yet. Ask an editor to create one for you."}
                    {failed && <span className="text-error ml-1">Could not send — please try again.</span>}
                </p>
            </div>
            {!isRequested && (
                <button
                    type="button"
                    className="shrink-0 px-4 py-1.5 rounded-lg bg-brand-green text-brand-navy text-xs font-bold hover:brightness-90 transition-all disabled:opacity-50"
                    disabled={isPending}
                    onClick={requestProfile}
                >
                    {isPending ? "Sending..." : "Ask for a profile"}
                </button>
            )}
        </div>
    );
}
