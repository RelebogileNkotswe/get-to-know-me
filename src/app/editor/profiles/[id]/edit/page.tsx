import { notFound } from "next/navigation";
import EditProfileView from "../../../../../components/EditProfileView";
import { profileService } from "../../../../../logic/profiles/ProfileService";

export default async function EditProfilePage(props: PageProps<"/editor/profiles/[id]/edit">) {
    const { id } = await props.params;
    const profile = profileService.getProfile(id);
    if (!profile) {
        notFound();
    }

    return (
        <EditProfileView
            profile={profile}
            accountStatus={profileService.getAccountStatus(id)}
            currentPhotoUrl="/avatar-placeholder.svg"
        />
    );
}
