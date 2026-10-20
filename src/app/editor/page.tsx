import EditorAccountsView from "../../components/EditorAccountsView";
import { requireUser } from "../../logic/auth/RequireUser";
import { profileService } from "../../logic/profiles/ProfileService";
import { editorAccountFilterFromParams, type IEditorAccountFilter } from "../../models/EditorAccount";
import { UserRole } from "../../models/UserRole";

export default async function EditorPage({ searchParams }: PageProps<"/editor">) {
    await requireUser(UserRole.Editor);
    const filter: IEditorAccountFilter = editorAccountFilterFromParams(await searchParams);
    return <EditorAccountsView accounts={await profileService.listEditorAccounts(filter)} filter={filter} />;
}
