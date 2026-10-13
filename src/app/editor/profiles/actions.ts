"use server";

import { revalidatePath } from "next/cache";
import type { SaveProfileResult } from "../../../interface/profiles/ProfileService";
import { authService } from "../../../logic/auth/AuthService";
import { profileService } from "../../../logic/profiles/ProfileService";
import type { IProfileFormValues } from "../../../models/ProfileForm";
import { hasRoleAtLeast } from "../../../models/UserRole";

const NOT_ALLOWED: SaveProfileResult = {
    ok: false,
    errors: { companyEmail: "You are not allowed to change profiles." },
};

// Server actions can be called directly with a POST request, so every action checks the signed-in user's role itself.
async function canEditProfiles(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    return user !== null && hasRoleAtLeast(user.role, "editor");
}

function refreshLists(): void {
    revalidatePath("/");
    revalidatePath("/editor");
}

export async function createProfileAction(values: IProfileFormValues): Promise<SaveProfileResult> {
    if (!(await canEditProfiles())) {
        return NOT_ALLOWED;
    }
    const result = await profileService.createProfile(values);
    if (result.ok) {
        refreshLists();
    }
    return result;
}

export async function updateProfileAction(profileId: string, values: IProfileFormValues): Promise<SaveProfileResult> {
    if (!(await canEditProfiles())) {
        return NOT_ALLOWED;
    }
    const result = await profileService.updateProfile(profileId, values);
    if (result.ok) {
        refreshLists();
    }
    return result;
}

/** Returns true when the profile was deleted. */
export async function deleteProfileAction(profileId: string): Promise<boolean> {
    if (!(await canEditProfiles())) {
        return false;
    }
    const deleted = await profileService.deleteProfile(profileId);
    if (deleted) {
        refreshLists();
    }
    return deleted;
}
