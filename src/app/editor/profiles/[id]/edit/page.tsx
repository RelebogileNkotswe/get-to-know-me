import { notFound } from "next/navigation";
import EditProfileView from "../../../../../components/EditProfileView";
import { requireUser } from "../../../../../logic/auth/RequireUser";
import { profileService } from "../../../../../logic/profiles/ProfileService";

export default async function EditProfilePage(props: PageProps<"/editor/profiles/[id]/edit">) {
    await requireUser("editor");
    const { id } = await props.params;
    const profile = await profileService.getProfile(id);
    if (!profile) {
        notFound();
    }

    return (
        <EditProfileView
            profileId={id}
            profile={profile}
            accountStatus={await profileService.getAccountStatus(id)}
            currentPhotoUrl="/avatar-placeholder.svg"
        />
    );
}
