import InviteManager from "../../../components/InviteManager";
import { requireUser } from "../../../logic/auth/RequireUser";
import { inviteService } from "../../../logic/invites/InviteService";

export default async function InvitesPage() {
    await requireUser("editor");
    return <InviteManager pendingInvites={await inviteService.listPendingInvites()} />;
}
