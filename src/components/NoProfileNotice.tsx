"use client";

import { useState, useTransition } from "react";
import { requestProfileAction } from "../app/profile/actions";

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
        <div role="status" className="alert alert-info alert-soft mx-6 mt-6">
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                <span>
                    {isRequested
                        ? "You have asked for a profile. An editor will see your request and can create it for you."
                        : "You do not have a Get To Know Me profile yet. Ask an editor to create one for you."}
                    {failed && " The request could not be sent. Try again."}
                </span>
                {!isRequested && (
                    <button type="button" className="btn btn-sm btn-primary" disabled={isPending} onClick={requestProfile}>
                        {isPending ? "Sending..." : "Ask for a profile"}
                    </button>
                )}
            </div>
        </div>
    );
}
