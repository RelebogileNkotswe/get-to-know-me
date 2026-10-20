"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { IProfileFormValues } from "../models/ProfileForm";
import Icon from "./Icon";
import ProfileTemplate from "./ProfileTemplate";

interface IProfilePrintViewProps {
    profileId: string;
    profile: IProfileFormValues;
    photoUrl: string | null;
}

/** The profile on one A5 sheet, with a toolbar that is left out of the print. */
export default function ProfilePrintView({ profileId, profile, photoUrl }: IProfilePrintViewProps) {
    const sheet = useRef<HTMLDivElement>(null);
    const [isTooLong, setIsTooLong] = useState<boolean>(false);

    useEffect(() => {
        const card: Element | null | undefined = sheet.current?.firstElementChild;
        if (card) {
            void document.fonts.ready.then(() => setIsTooLong(card.scrollHeight > card.clientHeight));
        }
    }, []);

    async function print(): Promise<void> {
        // Printing before the icon font loads would show the icon names as text.
        await document.fonts.ready;
        window.print();
    }

    return (
        <div className="flex min-h-screen flex-col items-center gap-4 bg-base-200 p-6 print:block print:bg-transparent print:p-0">
            <div className="flex w-[148mm] max-w-full flex-wrap items-center justify-between gap-2 print:hidden">
                <Link href={`/employees/${profileId}`} className="btn btn-ghost btn-sm">
                    <Icon name="arrow_back" />
                    Back to profile
                </Link>
                <button type="button" className="btn btn-sm btn-primary" onClick={print}>
                    <Icon name="picture_as_pdf" />
                    Save as PDF
                </button>
            </div>
            {isTooLong && (
                <div role="alert" className="alert alert-warning w-[148mm] max-w-full print:hidden">
                    <Icon name="warning" />
                    <span>
                        This profile is too long for one A5 page, so the end of it will be cut off. Shorten the text.
                    </span>
                </div>
            )}
            <p className="text-base-content/70 w-[148mm] max-w-full text-sm print:hidden">
                In the print dialog choose &quot;Save as PDF&quot;. The page is set to A5 with no margins.
            </p>
            <div ref={sheet} className="a5-sheet shadow-lg print:shadow-none">
                <ProfileTemplate profile={profile} photoUrl={photoUrl} isPrint />
            </div>
        </div>
    );
}
