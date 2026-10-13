"use server";

import { redirect } from "next/navigation";
import { authService } from "../../logic/auth/AuthService";

export interface ISignInFormState {
    error: string | null;
    /** Kept so the email box is not cleared after a failed attempt. */
    email: string;
}

export async function signInAction(_previous: ISignInFormState, formData: FormData): Promise<ISignInFormState> {
    const email: string = String(formData.get("email") ?? "");
    const password: string = String(formData.get("password") ?? "");
    if (email.trim() === "" || password === "") {
        return { error: "Enter your email and password.", email };
    }

    const result = await authService.signIn(email, password);
    if (!result.ok) {
        return { error: result.error, email };
    }
    redirect("/");
}

export async function signOutAction(): Promise<void> {
    await authService.signOut();
    redirect("/login");
}
