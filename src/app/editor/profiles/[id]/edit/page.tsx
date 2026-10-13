import { notFound } from "next/navigation";
import EditProfileView from "../../../../../components/EditProfileView";
import { requireUser } from "../../../../../logic/auth/RequireUser";
import { profileService } from "../../../../../logic/profiles/ProfileService";

export default async function EditProfilePage(props: PageProps<"/editor/profiles/[id]/edit">) {
    await requireUser("editor");
    const { id } = await props.params;
    const [profile, status] = await Promise.all([profileService.getProfile(id), profileService.getProfileStatus(id)]);
    if (!profile || !status) {
        notFound();
    }

    return (
        <EditProfileView
            profileId={id}
            profile={profile}
            status={status}
            accountStatus={await profileService.getAccountStatus(id)}
            currentPhotoUrl="/avatar-placeholder.svg"
        />
    );
}
