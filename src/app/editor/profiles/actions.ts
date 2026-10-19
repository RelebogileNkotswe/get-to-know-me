"use server";

import { revalidatePath } from "next/cache";
import type { SavePhotoResult } from "../../../interface/photos/PhotoService";
import type { SaveProfileResult } from "../../../interface/profiles/ProfileService";
import { currentUserWithRole } from "../../../logic/auth/RequireUser";
import { photoService } from "../../../logic/photos/PhotoService";
import { profileService } from "../../../logic/profiles/ProfileService";
import { userActor } from "../../../models/Audit";
import type { IProfileFormValues } from "../../../models/ProfileForm";
import { UserRole } from "../../../models/UserRole";

const NOT_ALLOWED: SaveProfileResult = {
    ok: false,
    errors: { companyEmail: "You are not allowed to change profiles." },
};

function refreshLists(): void {
    revalidatePath("/");
    revalidatePath("/editor");
}

// Server actions can be called directly with a POST request, so every action checks the signed-in user's role itself.
export async function createProfileAction(values: IProfileFormValues): Promise<SaveProfileResult> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return NOT_ALLOWED;
    }
    const result = await profileService.createProfile(values, userActor(editor));
    if (result.ok) {
        refreshLists();
    }
    return result;
}

export async function updateProfileAction(profileId: string, values: IProfileFormValues): Promise<SaveProfileResult> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return NOT_ALLOWED;
    }
    const result = await profileService.updateProfile(profileId, values, userActor(editor));
    if (result.ok) {
        refreshLists();
    }
    return result;
}

/** Saves or replaces a profile's photo. The image is checked and compressed on the server. */
export async function uploadProfilePhotoAction(profileId: string, formData: FormData): Promise<SavePhotoResult> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return { ok: false, error: "You are not allowed to change profiles." };
    }
    const file: FormDataEntryValue | null = formData.get("photo");
    if (!(file instanceof File)) {
        return { ok: false, error: "Choose a photo first." };
    }
    const result = await photoService.savePhoto(profileId, new Uint8Array(await file.arrayBuffer()), userActor(editor));
    if (result.ok) {
        // The photo shows on cards, the carousel and the profile page, so every page is refreshed.
        revalidatePath("/", "layout");
    }
    return result;
}

/** Publishes a profile the employee submitted, so it shows in the employee list. Returns true when it was published. */
export async function publishProfileAction(profileId: string): Promise<boolean> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return false;
    }
    const published = await profileService.publishProfile(profileId, userActor(editor));
    if (published) {
        refreshLists();
        revalidatePath("/editor/invites");
    }
    return published;
}

/** Returns true when the profile was deleted. */
export async function deleteProfileAction(profileId: string): Promise<boolean> {
    const editor = await currentUserWithRole(UserRole.Editor);
    if (!editor) {
        return false;
    }
    const deleted = await profileService.deleteProfile(profileId, userActor(editor));
    if (deleted) {
        refreshLists();
    }
    return deleted;
}
