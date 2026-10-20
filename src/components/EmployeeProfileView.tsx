import Link from "next/link";
import type { IProfileFormValues } from "../models/ProfileForm";
import Icon from "./Icon";
import ProfileTemplate from "./ProfileTemplate";

interface IEmployeeProfileViewProps {
    profileId: string;
    profile: IProfileFormValues;
    /** Show the edit and export actions; only editors and admins can use them. */
    canEdit: boolean;
    /** Address the photo loads from, or null to show their initials. */
    photoUrl: string | null;
}

/**
 * A published profile in the Get To Know Me template. Editors and admins also see the edit and PDF export actions.
 */
export default function EmployeeProfileView({ profileId, profile, canEdit, photoUrl }: IEmployeeProfileViewProps) {
    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-2">
                <Link href="/" className="btn btn-ghost btn-sm">
                    <Icon name="arrow_back" />
                    Back to directory
                </Link>
                {canEdit && (
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/employees/${profileId}/print`} className="btn btn-sm btn-primary">
                            <Icon name="download" />
                            Export as PDF (A5 format)
                        </Link>
                        <Link href={`/editor/profiles/${profileId}/edit`} className="btn btn-sm btn-outline">
                            <Icon name="edit" />
                            Edit profile
                        </Link>
                    </div>
                )}
            </div>

            <ProfileTemplate profile={profile} photoUrl={photoUrl} />
        </div>
    );
}
