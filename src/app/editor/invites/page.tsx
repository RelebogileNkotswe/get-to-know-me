import InviteManager from "../../../components/InviteManager";
import { requireUser } from "../../../logic/auth/RequireUser";
import { inviteService } from "../../../logic/invites/InviteService";
import { UserRole } from "../../../models/UserRole";

export default async function InvitesPage() {
    await requireUser(UserRole.Editor);
    return <InviteManager pendingInvites={await inviteService.listPendingInvites()} />;
}
