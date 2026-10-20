import type { IProfileFormValues } from "../models/ProfileForm";
import { ClientUtils } from "../utils/ClientUtils";
import Icon from "./Icon";

interface IProfileTemplateProps {
    profile: IProfileFormValues;
    /** Address the photo loads from, or null to show their initials. */
    photoUrl: string | null;
    /** The A5 print version: fills the sheet, and email and LinkedIn are plain text. */
    isPrint?: boolean;
}

interface IProfileSection {
    title: string;
    caption: string;
    icon: string;
    text: string;
}

/** The Get To Know Me template, shared by the profile page and the PDF export so both look the same. */
export default function ProfileTemplate({ profile, photoUrl, isPrint = false }: IProfileTemplateProps) {
    const name: string = `${profile.firstName} ${profile.lastName}`.trim() || profile.companyEmail;
    const linkedInText: string = profile.linkedIn.replace(/^https?:\/\/(www\.)?/, "");
    const sections: IProfileSection[] = [
        { title: "Beyond the office gates", caption: "Hobbies & Interests", icon: "hiking", text: profile.hobbies },
        {
            title: "Beyond the bio",
            caption: "Curiosities & Quirks",
            icon: "lightbulb",
            text: profile.somethingInteresting,
        },
        {
            title: "Educational & professional background",
            caption: "Foundation",
            icon: "school",
            text: profile.background,
        },
    ];

    // Tighter on A5 so a profile at the character limit fits on one sheet.
    const spacing = isPrint
        ? { card: "size-full gap-3", box: "p-3", divider: "my-2" }
        : { card: "mx-auto w-full max-w-xl gap-5 rounded-2xl shadow-lg", box: "p-4", divider: "my-3" };

    return (
        <article className={`flex flex-col overflow-hidden bg-[#0b1b30] p-6 text-white ${spacing.card}`}>
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
                                Started: {ClientUtils.formatLongDate(profile.startDate)}
                            </span>
                        )}
                    </div>
                    <ul className="mt-1 flex flex-col gap-1 text-xs text-white/80">
                        <li className="flex items-center gap-1.5">
                            <Icon name="mail" />
                            {isPrint ? (
                                <span>{profile.companyEmail}</span>
                            ) : (
                                <a className="hover:underline" href={`mailto:${profile.companyEmail}`}>
                                    {profile.companyEmail}
                                </a>
                            )}
                        </li>
                        {profile.linkedIn && (
                            <li className="flex items-center gap-1.5">
                                <Icon name="link" />
                                {isPrint ? (
                                    <span>{linkedInText}</span>
                                ) : (
                                    <a
                                        className="hover:underline"
                                        href={profile.linkedIn}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {linkedInText}
                                    </a>
                                )}
                            </li>
                        )}
                    </ul>
                </div>
                <div className="relative shrink-0">
                    <div
                        className="absolute -top-2 -right-2 size-28 rotate-6 rounded-2xl bg-[#2fe3a5]/30"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute -bottom-2 -left-2 size-28 -rotate-6 rounded-2xl bg-[#3b82f6]/40"
                        aria-hidden="true"
                    />
                    {photoUrl ? (
                        <div className="relative aspect-[4/5] w-28 overflow-hidden rounded-2xl border-4 border-white bg-[#16314f]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photoUrl} alt={`${name} profile picture`} className="size-full object-cover" />
                        </div>
                    ) : (
                        <div
                            className="relative flex aspect-[4/5] w-28 items-center justify-center rounded-2xl border-4 border-white bg-[#16314f] text-3xl font-semibold text-white/90"
                            aria-hidden="true"
                        >
                            {ClientUtils.getInitials(name)}
                        </div>
                    )}
                </div>
            </header>

            {sections.map((section: IProfileSection) => (
                <section key={section.title} className={`rounded-xl bg-white/5 ${spacing.box}`}>
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-base font-semibold">
                            <span className="flex size-7 items-center justify-center rounded-md bg-[#2fe3a5]/20 text-[#2fe3a5]">
                                <Icon name={section.icon} />
                            </span>
                            {section.title}
                        </h2>
                        <span className="text-xs text-white/50">{section.caption}</span>
                    </div>
                    <div className={`${spacing.divider} h-px bg-white/10`} />
                    <p className="text-sm whitespace-pre-line text-white/85">
                        {section.text || <span className="text-white/40">Nothing added yet.</span>}
                    </p>
                </section>
            ))}

            <footer className={`rounded-xl bg-[#2fe3a5]/15 ${spacing.box} ${isPrint ? "mt-auto" : ""}`}>
                <p className="font-semibold text-[#2fe3a5]">Welcome to Singular Systems</p>
                <p className="text-xs text-white/70">
                    We are delighted to have your energy, innovation, and expertise in the team.
                </p>
            </footer>
        </article>
    );
}
