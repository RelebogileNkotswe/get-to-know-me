"use server";

import { revalidatePath } from "next/cache";
import { authService } from "../../logic/auth/AuthService";
import { profileService } from "../../logic/profiles/ProfileService";

/** Lets the signed-in user, who has no profile, ask editors to create one. Returns true when the request was recorded. */
export async function requestProfileAction(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
        return false;
    }
    await profileService.requestProfile(user.id);
    revalidatePath("/editor");
    return true;
}

export interface IChangePasswordFormState {
    errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
    isSaved: boolean;
}

export async function changePasswordAction(
    _previous: IChangePasswordFormState,
    formData: FormData,
): Promise<IChangePasswordFormState> {
    const currentPassword: string = String(formData.get("currentPassword") ?? "");
    const newPassword: string = String(formData.get("newPassword") ?? "");
    const confirmPassword: string = String(formData.get("confirmPassword") ?? "");

    if (currentPassword === "") {
        return { errors: { currentPassword: "Enter your current password." }, isSaved: false };
    }
    if (newPassword !== confirmPassword) {
        return { errors: { confirmPassword: "The two new passwords do not match." }, isSaved: false };
    }

    const result = await authService.changePassword(currentPassword, newPassword);
    return result.ok ? { errors: {}, isSaved: true } : { errors: result.errors, isSaved: false };
}
