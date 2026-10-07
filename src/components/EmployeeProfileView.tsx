import Link from "next/link";
import { getInitials } from "../models/Employee";
import type { IProfileFormValues } from "../models/ProfileForm";
import Icon from "./Icon";

interface IEmployeeProfileViewProps {
    profileId: string;
    profile: IProfileFormValues;
    /** Show the edit and export actions; only editors and admins can use them. */
    canEdit: boolean;
}

interface IProfileSection {
    title: string;
    caption: string;
    icon: string;
    text: string;
}

/** Date such as 2026-10-07 shown as "7 October 2026". */
function formatStartDate(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

/**
 * The Get To Know Me template: one fixed design that shows any published profile, so layout and styling
 * never depend on who entered the details. Editors and admins also see the edit and export actions.
 * TODO: the company logo, employee photo, A5 fitting and the PDF export are still to come.
 */
export default function EmployeeProfileView({ profileId, profile, canEdit }: IEmployeeProfileViewProps) {
    const name: string = `${profile.firstName} ${profile.lastName}`.trim() || profile.companyEmail;
    const sections: IProfileSection[] = [
        { title: "Beyond the office gates", caption: "Hobbies & Interests", icon: "hiking", text: profile.hobbies },
        { title: "Beyond the bio", caption: "Curiosities & Quirks", icon: "lightbulb", text: profile.somethingInteresting },
        {
            title: "Educational & professional background",
            caption: "Foundation",
            icon: "school",
            text: profile.background,
        },
    ];

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-2">
                <Link href="/" className="btn btn-ghost btn-sm">
                    <Icon name="arrow_back" />
                    Back to directory
                </Link>
                {canEdit && (
                    <div className="flex flex-wrap gap-2">
                        {/* TODO: enabled once the PDF export is built. */}
                        <button type="button" className="btn btn-sm btn-primary" disabled title="Coming soon">
                            <Icon name="download" />
                            Export as PDF (A5 format)
                        </button>
                        <Link href={`/editor/profiles/${profileId}/edit`} className="btn btn-sm btn-outline">
                            <Icon name="edit" />
                            Edit profile
                        </Link>
                    </div>
                )}
            </div>

            <article className="mx-auto flex w-full max-w-xl flex-col gap-5 overflow-hidden rounded-2xl bg-[#0b1b30] p-6 text-white shadow-lg">
                <header className="relative flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        {/* TODO: replace this text with the company logo once the file is supplied. */}
                        <p className="text-sm font-semibold tracking-wide text-white/80">Singular Systems</p>
                        <p className="mt-4 text-xs font-semibold tracking-widest text-[#2fe3a5]">GET TO KNOW...</p>
                        <h1 className="text-3xl leading-tight font-bold">
                            <span className="text-white">{profile.firstName}</span>{" "}
                            <span className="text-[#2fe3a5]">{profile.lastName}</span>
                            {!profile.firstName && !profile.lastName && <span>{name}</span>}
                        </h1>
                        {profile.position && <p className="font-medium text-white/90">{profile.position}</p>}
                        <div className="flex flex-wrap gap-2 text-xs">
                            {profile.preferredName && (
                                <span className="rounded-md bg-[#2fe3a5]/20 px-2 py-1 font-semibold text-[#2fe3a5]">
                                    Call me {profile.preferredName}
                                </span>
                            )}
                            {profile.startDate && (
                                <span className="rounded-md bg-white/10 px-2 py-1 text-white/80">
                                    Started: {formatStartDate(profile.startDate)}
                                </span>
                            )}
                        </div>
                        <ul className="mt-1 flex flex-col gap-1 text-xs text-white/80">
                            <li className="flex items-center gap-1.5">
                                <Icon name="mail" />
                                <a className="hover:underline" href={`mailto:${profile.companyEmail}`}>
                                    {profile.companyEmail}
                                </a>
                            </li>
                            {profile.linkedIn && (
                                <li className="flex items-center gap-1.5">
                                    <Icon name="link" />
                                    <a
                                        className="hover:underline"
                                        href={profile.linkedIn}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {profile.linkedIn.replace(/^https?:\/\/(www\.)?/, "")}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                    <div className="relative shrink-0">
                        <div className="absolute -top-2 -right-2 size-28 rotate-6 rounded-2xl bg-[#2fe3a5]/30" aria-hidden="true" />
                        <div className="absolute -bottom-2 -left-2 size-28 -rotate-6 rounded-2xl bg-[#3b82f6]/40" aria-hidden="true" />
                        {/* TODO: show the employee photo once photo upload and storage exist. */}
                        <div
                            className="relative flex size-28 items-center justify-center rounded-2xl border-4 border-white bg-[#16314f] text-3xl font-semibold text-white/90"
                            aria-hidden="true"
                        >
                            {getInitials(name)}
                        </div>
                    </div>
                </header>

                {sections.map((section: IProfileSection) => (
                    <section key={section.title} className="rounded-xl bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="flex items-center gap-2 text-base font-semibold">
                                <span className="flex size-7 items-center justify-center rounded-md bg-[#2fe3a5]/20 text-[#2fe3a5]">
                                    <Icon name={section.icon} />
                                </span>
                                {section.title}
                            </h2>
                            <span className="text-xs text-white/50">{section.caption}</span>
                        </div>
                        <div className="my-3 h-px bg-white/10" />
                        <p className="text-sm whitespace-pre-line text-white/85">
                            {section.text || <span className="text-white/40">Nothing added yet.</span>}
                        </p>
                    </section>
                ))}

                <footer className="rounded-xl bg-[#2fe3a5]/15 p-4">
                    <p className="font-semibold text-[#2fe3a5]">Welcome to Singular Systems</p>
                    <p className="text-xs text-white/70">
                        We are delighted to have your energy, innovation, and expertise in the team.
                    </p>
                </footer>
            </article>
        </div>
    );
}
