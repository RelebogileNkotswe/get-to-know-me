"use server";

import { revalidatePath } from "next/cache";
import type { IOpenInvite, SubmitInviteResult } from "../../interface/invites/InviteService";
import type { SavePhotoResult } from "../../interface/photos/PhotoService";
import { inviteService } from "../../logic/invites/InviteService";
import { photoService } from "../../logic/photos/PhotoService";
import { AuditActorType } from "../../models/Audit";
import type { IProfileFormValues } from "../../models/ProfileForm";

/**
 * Saves the photo a new joiner chose on their private invite page, to the profile their link belongs to. Public like the
 * form itself: the private token must match an invite that is still open, and the photo is checked and compressed on the server.
 */
export async function uploadInvitePhotoAction(token: string, formData: FormData): Promise<SavePhotoResult> {
    const file: FormDataEntryValue | null = formData.get("photo");
    if (!(file instanceof File)) {
        return { ok: false, error: "Choose a photo first." };
    }
    const invite: IOpenInvite | null = await inviteService.findOpenInvite(String(token));
    if (invite === null) {
        return { ok: false, error: "This link no longer works." };
    }
    return photoService.savePhoto(invite.profileId, new Uint8Array(await file.arrayBuffer()), {
        type: AuditActorType.Invitee,
        email: invite.companyEmail,
    });
}

/**
 * Called by a new joiner from their private invite link, so there is no signed-in user to check. The private token is
 * the only protection: it must match an invite that is still open, and the service ignores any email the browser sends.
 */
export async function submitInviteAction(token: string, values: IProfileFormValues): Promise<SubmitInviteResult> {
    const result = await inviteService.submitInvite(String(token), values);
    if (result.ok) {
        // So editors see the new "awaiting review" profile straight away.
        revalidatePath("/editor/invites");
        revalidatePath("/editor");
        revalidatePath("/");
    }
    return result;
}
