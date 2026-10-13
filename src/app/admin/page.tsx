import AdminUsersView from "../../components/AdminUsersView";
import { requireUser } from "../../logic/auth/RequireUser";
import { userService } from "../../logic/users/UserService";

export default async function AdminPage() {
    const admin = await requireUser("admin");
    return <AdminUsersView users={await userService.listUsers()} currentUserId={admin.id} />;
}
