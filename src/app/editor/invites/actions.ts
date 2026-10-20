"use server";

import { revalidatePath } from "next/cache";
import { currentUserWithRole } from "../../../logic/auth/RequireUser";
import { inviteService } from "../../../logic/invites/InviteService";
import { userActor } from "../../../models/Audit";
import { inviteLinkPath } from "../../../models/Invite";
import type { IProfileFormValues, ProfileFormErrors } from "../../../models/ProfileForm";
import { UserRole } from "../../../models/UserRole";

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
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return NOT_ALLOWED;
    }
    const result = await inviteService.createInvite(values, userActor(editor));
    if (!result.ok) {
        return result;
    }
    refreshLists();
    return { ok: true, profileId: result.profileId, linkPath: inviteLinkPath(result.token) };
}

/** Replaces an invite's link. Returns the new link path, or null when the invite can no longer be renewed. */
export async function renewInviteLinkAction(profileId: string): Promise<string | null> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return null;
    }
    const token: string | null = await inviteService.renewLink(profileId, userActor(editor));
    if (token === null) {
        return null;
    }
    refreshLists();
    return inviteLinkPath(token);
}

/** Returns true when the invite was cancelled. */
export async function cancelInviteAction(profileId: string): Promise<boolean> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return false;
    }
    const cancelled: boolean = await inviteService.cancelInvite(profileId, userActor(editor));
    if (cancelled) {
        refreshLists();
    }
    return cancelled;
}
