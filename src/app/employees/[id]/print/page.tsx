import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfilePrintView from "../../../../components/ProfilePrintView";
import { requireUser } from "../../../../logic/auth/RequireUser";
import { photoService } from "../../../../logic/photos/PhotoService";
import { profileService } from "../../../../logic/profiles/ProfileService";
import { UserRole } from "../../../../models/UserRole";

// The browser uses the title as the PDF's file name.
export async function generateMetadata(props: PageProps<"/employees/[id]/print">): Promise<Metadata> {
    await requireUser(UserRole.Editor);
    const { id } = await props.params;
    const profile = await profileService.getPublishedProfile(id);
    const name: string = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";
    return { title: name ? `Get To Know Me - ${name}` : "Get To Know Me" };
}

export default async function ProfilePrintPage(props: PageProps<"/employees/[id]/print">) {
    await requireUser(UserRole.Editor);
    const { id } = await props.params;
    const profile = await profileService.getPublishedProfile(id);
    if (!profile) {
        notFound();
    }

    return <ProfilePrintView profileId={id} profile={profile} photoUrl={await photoService.getPhotoUrl(id)} />;
}
