import ChangePasswordForm from "../../components/ChangePasswordForm";
import { requireUser } from "../../logic/auth/RequireUser";

export default async function ProfilePage() {
    const user = await requireUser();
    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold">Profile</h1>
                <p className="text-base-content/70 mt-2">Signed in as {user.email}.</p>
            </div>
            <ChangePasswordForm />
        </div>
    );
}
