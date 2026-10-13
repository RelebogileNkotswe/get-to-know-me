import EditorAccountsView from "../../components/EditorAccountsView";
import { requireUser } from "../../logic/auth/RequireUser";
import { profileService } from "../../logic/profiles/ProfileService";

export default async function EditorPage() {
    await requireUser("editor");
    return <EditorAccountsView initialAccounts={await profileService.listEditorAccounts()} />;
}
