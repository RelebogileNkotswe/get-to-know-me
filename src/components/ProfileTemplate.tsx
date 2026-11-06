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
    text: string;
}

/**
 * The Get To Know Me template, shared by the profile page and the PDF export so both look the same. It follows the Singular
 * Systems "Get to know..." poster: navy page, white text, green accents, a leaf-shaped photo with decorative shapes behind it,
 * and sections split by thin lines. Colours are fixed, so it looks the same in light and dark mode and always prints the same.
 */
export default function ProfileTemplate({ profile, photoUrl, isPrint = false }: IProfileTemplateProps) {
    const name: string = `${profile.firstName} ${profile.lastName}`.trim() || profile.companyEmail;
    const linkedInText: string = profile.linkedIn.replace(/^https?:\/\/(www\.)?/, "");
    const sections: IProfileSection[] = [
        { title: "Beyond the office gates", caption: "Hobbies & Interests", text: profile.hobbies },
        { title: "Beyond the bio", caption: "Curiosities & Quirks", text: profile.somethingInteresting },
        { title: "Educational & professional background", caption: "Foundation", text: profile.background },
    ];

    // Tighter on A5 so a profile at the character limit fits on one sheet.
    const spacing = isPrint
        ? { card: "size-full", header: "gap-3 pb-4", section: "py-3" }
        : { card: "mx-auto w-full max-w-xl rounded-lg", header: "gap-4 pb-6", section: "py-5" };

    return (
        <article className={`relative flex flex-col overflow-hidden bg-[#1b2a44] px-6 pt-5 text-white ${spacing.card}`}>
            {/* Two fixed columns so the photo always stays top right at about 42% of the card's width, as in the poster. */}
            <header className={`relative grid grid-cols-[minmax(0,1fr)_42%] items-start ${spacing.header}`}>
                <div className="flex min-w-0 flex-col gap-3">
                    {/* TODO: replace this text with the company logo once the file is supplied. */}
                    <p className="text-lg tracking-tight">
                        <span className="font-bold">singular</span>
                        <span className="font-normal">systems</span>
                    </p>
                    <p className="mt-2 text-2xl font-bold">Get to know...</p>
                    <h1 className="flex flex-col text-4xl leading-tight font-bold">
                        <span>{profile.firstName}</span>
                        <span className="text-[#4fbf7a]">{profile.lastName}</span>
                        {!profile.firstName && !profile.lastName && <span>{name}</span>}
                    </h1>
                    {profile.position && <p className="text-sm">{profile.position}</p>}
                    <div className="flex flex-wrap gap-2 text-xs">
                        {profile.preferredName && (
                            <span className="rounded-tl-lg rounded-br-lg bg-[#4fbf7a] px-3 py-1.5 font-semibold text-[#1b2a44]">
                                Call me {profile.preferredName}
                            </span>
                        )}
                        {profile.startDate && (
                            <span className="rounded-tl-lg rounded-br-lg bg-[#26385a] px-3 py-1.5 text-white/90">
                                Started: {ClientUtils.formatLongDate(profile.startDate)}
                            </span>
                        )}
                    </div>
                    <ul className="flex flex-col gap-1 text-xs text-white/80">
                        <li className="flex items-center gap-1.5">
                            <Icon name="mail" className="text-[#4fbf7a]" />
                            {isPrint ? (
                                <span>{profile.companyEmail}</span>
                            ) : (
                                <a className="break-all hover:underline" href={`mailto:${profile.companyEmail}`}>
                                    {profile.companyEmail}
                                </a>
                            )}
                        </li>
                        {profile.linkedIn && (
                            <li className="flex items-center gap-1.5">
                                <Icon name="link" className="text-[#4fbf7a]" />
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
                <div className="relative -mr-2 mt-2">
                    {/* Decorative shapes, placed relative to the photo so they always frame it; the card clips the overflow. */}
                    <div aria-hidden="true">
                        <div className="absolute -top-16 right-4 size-36 rounded-full bg-[#26385a]" />
                        <div className="absolute -top-12 -right-10 size-20 rounded-bl-full bg-[#a6dcc3]" />
                        <div className="absolute -top-10 -left-10 size-16 rounded-tl-lg rounded-bl-full bg-[#4fbf7a]" />
                        <div className="absolute top-12 -left-8 size-14 rounded-l-full bg-[#a6dcc3]" />
                        <div className="absolute -right-10 -bottom-8 size-20 rounded-tl-full bg-[#4fbf7a]" />
                    </div>
                    {photoUrl ? (
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-tl-[2.5rem] rounded-br-[2.5rem] border-4 border-white bg-[#26385a]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photoUrl} alt={`${name} profile picture`} className="size-full object-cover" />
                        </div>
                    ) : (
                        <div
                            className="relative flex aspect-[3/4] w-full items-center justify-center rounded-tl-[2.5rem] rounded-br-[2.5rem] border-4 border-white bg-[#26385a] text-5xl font-semibold"
                            aria-hidden="true"
                        >
                            {ClientUtils.getInitials(name)}
                        </div>
                    )}
                </div>
            </header>

            {sections.map((section: IProfileSection) => (
                <section key={section.title} className={`relative border-t border-white/20 ${spacing.section}`}>
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2.5 text-lg font-bold">
                            <span
                                className="size-5 shrink-0 rounded-tl-md rounded-br-md bg-[#4fbf7a]"
                                aria-hidden="true"
                            />
                            {section.title}
                        </h2>
                        <span className="shrink-0 text-xs text-white/60">{section.caption}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-white/90">
                        {section.text || <span className="text-white/50">Nothing added yet.</span>}
                    </p>
                </section>
            ))}

            <footer
                className={`relative flex flex-wrap items-end justify-between gap-3 border-t border-white/20 ${isPrint ? "mt-auto" : ""}`}
            >
                <p className="max-w-64 pb-2 text-xs text-white/80">
                    We are delighted to have your energy, innovation, and expertise in the team.
                </p>
                <p className="rounded-tl-lg bg-[#4fbf7a] px-4 py-2 text-sm font-semibold text-[#1b2a44]">
                    Welcome to Singular Systems
                </p>
            </footer>
        </article>
    );
}
