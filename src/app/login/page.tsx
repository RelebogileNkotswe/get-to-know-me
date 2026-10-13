import { redirect } from "next/navigation";
import LoginForm from "../../components/LoginForm";
import { authService } from "../../logic/auth/AuthService";

export default async function LoginPage() {
    if (await authService.getCurrentUser()) {
        redirect("/");
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <LoginForm />
        </main>
    );
}
