import { redirect } from "next/navigation";
import LoginForm from "../../components/LoginForm";
import { authService } from "../../logic/auth/AuthService";

export default async function LoginPage() {
    if (await authService.getCurrentUser()) {
        redirect("/");
    }

    return <LoginForm />;
}
