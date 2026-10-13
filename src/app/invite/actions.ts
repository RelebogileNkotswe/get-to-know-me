"use server";

import { revalidatePath } from "next/cache";
import type { SubmitInviteResult } from "../../interface/invites/InviteService";
import { inviteService } from "../../logic/invites/InviteService";
import type { IProfileFormValues } from "../../models/ProfileForm";

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
