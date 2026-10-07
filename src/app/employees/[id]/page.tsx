import { notFound } from "next/navigation";
import EmployeeProfileView from "../../../components/EmployeeProfileView";
import { profileService } from "../../../logic/profiles/ProfileService";

export default async function EmployeeProfilePage(props: PageProps<"/employees/[id]">) {
    const { id } = await props.params;
    const profile = await profileService.getPublishedProfile(id);
    if (!profile) {
        notFound();
    }

    return <EmployeeProfileView profile={profile} />;
}
