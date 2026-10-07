import { notFound } from "next/navigation";
import EmployeeProfileView from "../../../components/EmployeeProfileView";
import { requireUser } from "../../../logic/auth/RequireUser";
import { profileService } from "../../../logic/profiles/ProfileService";
import { hasRoleAtLeast } from "../../../models/UserRole";

export default async function EmployeeProfilePage(props: PageProps<"/employees/[id]">) {
    const user = await requireUser();
    const { id } = await props.params;
    const profile = await profileService.getPublishedProfile(id);
    if (!profile) {
        notFound();
    }

    return <EmployeeProfileView profileId={id} profile={profile} canEdit={hasRoleAtLeast(user.role, "editor")} />;
}
