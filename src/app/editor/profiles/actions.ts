"use server";

import { revalidatePath } from "next/cache";
import type { SavePhotoResult } from "../../../interface/photos/PhotoService";
import type { SaveProfileResult } from "../../../interface/profiles/ProfileService";
import { authService } from "../../../logic/auth/AuthService";
import { photoService } from "../../../logic/photos/PhotoService";
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

/** Saves or replaces a profile's photo. The image is checked and compressed on the server. */
export async function uploadProfilePhotoAction(profileId: string, formData: FormData): Promise<SavePhotoResult> {
    if (!(await canEditProfiles())) {
        return { ok: false, error: "You are not allowed to change profiles." };
    }
    const file: FormDataEntryValue | null = formData.get("photo");
    if (!(file instanceof File)) {
        return { ok: false, error: "Choose a photo first." };
    }
    const result = await photoService.savePhoto(profileId, new Uint8Array(await file.arrayBuffer()));
    if (result.ok) {
        // The photo shows on cards, the carousel and the profile page, so every page is refreshed.
        revalidatePath("/", "layout");
    }
    return result;
}

/** Publishes a profile the employee submitted, so it shows in the employee list. Returns true when it was published. */
export async function publishProfileAction(profileId: string): Promise<boolean> {
    if (!(await canEditProfiles())) {
        return false;
    }
    const published = await profileService.publishProfile(profileId);
    if (published) {
        refreshLists();
        revalidatePath("/editor/invites");
    }
    return published;
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
