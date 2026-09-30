import EditorAccountsView from "../../components/EditorAccountsView";
import { profileService } from "../../logic/profiles/ProfileService";

export default async function EditorPage() {
    return <EditorAccountsView initialAccounts={await profileService.listEditorAccounts()} />;
}
