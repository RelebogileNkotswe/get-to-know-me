import Link from "next/link";
import { getInitials } from "../models/Employee";
import type { IProfileFormValues } from "../models/ProfileForm";
import Icon from "./Icon";

interface IEmployeeProfileViewProps {
    profile: IProfileFormValues;
}

/**
 * Simple profile page for one published employee, built from the saved details.
 * TODO: replace with the designed Get To Know Me template (also used for the PDF export).
 */
export default function EmployeeProfileView({ profile }: IEmployeeProfileViewProps) {
    const name: string = `${profile.firstName} ${profile.lastName}`.trim() || profile.companyEmail;
    const sections: { title: string; text: string }[] = [
        { title: "Beyond the office gates", text: profile.hobbies },
        { title: "Beyond the bio", text: profile.somethingInteresting },
        { title: "Educational & professional background", text: profile.background },
    ];

    return (
        <div className="flex max-w-3xl flex-col gap-6 p-6">
            <div className="flex flex-wrap items-center gap-4">
                <div
                    className="bg-primary/15 text-primary flex size-20 items-center justify-center rounded-full text-2xl font-semibold"
                    aria-hidden="true"
                >
                    {getInitials(name)}
                </div>
                <div>
                    <h1 className="text-2xl font-semibold">{name}</h1>
                    {profile.position && <p>{profile.position}</p>}
                    {profile.preferredName && (
                        <span className="badge badge-success mt-1">Call me {profile.preferredName}</span>
                    )}
                </div>
            </div>

            <ul className="flex flex-col gap-2 text-sm">
                {profile.startDate && (
                    <li className="flex items-center gap-2">
                        <Icon name="calendar_today" />
                        Started {profile.startDate}
                    </li>
                )}
                <li className="flex items-center gap-2">
                    <Icon name="mail" />
                    <a className="link" href={`mailto:${profile.companyEmail}`}>
                        {profile.companyEmail}
                    </a>
                </li>
                {profile.linkedIn && (
                    <li className="flex items-center gap-2">
                        <Icon name="link" />
                        <a className="link" href={profile.linkedIn} target="_blank" rel="noopener noreferrer">
                            LinkedIn
                        </a>
                    </li>
                )}
            </ul>

            {sections.map((section) => (
                <section key={section.title} className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">{section.title}</h2>
                    <div className="divider my-0" />
                    <p className="whitespace-pre-line">{section.text || "Nothing added yet."}</p>
                </section>
            ))}

            <div>
                <Link href="/" className="btn btn-ghost">
                    <Icon name="arrow_back" />
                    Back to employees
                </Link>
            </div>
        </div>
    );
}
