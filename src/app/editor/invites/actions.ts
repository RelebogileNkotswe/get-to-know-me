"use server";

import { revalidatePath } from "next/cache";
import { currentUserHasRole } from "../../../logic/auth/RequireUser";
import { inviteService } from "../../../logic/invites/InviteService";
import { inviteLinkPath } from "../../../models/Invite";
import type { IProfileFormValues, ProfileFormErrors } from "../../../models/ProfileForm";

/** The new link as a path on this site; the screen adds the site's own address in front of it. */
export type InviteLinkResult = { ok: true; profileId: string; linkPath: string } | { ok: false; errors: ProfileFormErrors };

const NOT_ALLOWED: InviteLinkResult = {
    ok: false,
    errors: { companyEmail: "You are not allowed to send invites." },
};

function refreshLists(): void {
    revalidatePath("/editor");
    revalidatePath("/editor/invites");
}

// Server actions can be called directly with a POST request, so each one checks the signed-in user's role itself.
export async function createInviteAction(values: IProfileFormValues): Promise<InviteLinkResult> {
    if (!(await currentUserHasRole("editor"))) {
        return NOT_ALLOWED;
    }
    const result = await inviteService.createInvite(values);
    if (!result.ok) {
        return result;
    }
    refreshLists();
    return { ok: true, profileId: result.profileId, linkPath: inviteLinkPath(result.token) };
}

/** Replaces an invite's link. Returns the new link path, or null when the invite can no longer be renewed. */
export async function renewInviteLinkAction(profileId: string): Promise<string | null> {
    if (!(await currentUserHasRole("editor"))) {
        return null;
    }
    const token: string | null = await inviteService.renewLink(profileId);
    if (token === null) {
        return null;
    }
    refreshLists();
    return inviteLinkPath(token);
}

/** Returns true when the invite was cancelled. */
export async function cancelInviteAction(profileId: string): Promise<boolean> {
    if (!(await currentUserHasRole("editor"))) {
        return false;
    }
    const cancelled: boolean = await inviteService.cancelInvite(profileId);
    if (cancelled) {
        refreshLists();
    }
    return cancelled;
}
