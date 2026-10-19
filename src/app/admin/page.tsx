import AdminUsersView from "../../components/AdminUsersView";
import { requireUser } from "../../logic/auth/RequireUser";
import { userService } from "../../logic/users/UserService";
import { userAccountFilterFromParams, type IUserAccountFilter } from "../../models/UserAccount";
import { UserRole } from "../../models/UserRole";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
    const admin = await requireUser(UserRole.Admin);
    const filter: IUserAccountFilter = userAccountFilterFromParams(await searchParams);
    return <AdminUsersView users={await userService.listUsers(filter)} filter={filter} currentUserId={admin.id} />;
}
