import EditorAccountsView from "../../components/EditorAccountsView";
import { requireUser } from "../../logic/auth/RequireUser";
import { profileService } from "../../logic/profiles/ProfileService";
import { editorAccountFilterFromParams, type IEditorAccountFilter } from "../../models/EditorAccount";

export default async function EditorPage({ searchParams }: PageProps<"/editor">) {
    await requireUser("editor");
    const filter: IEditorAccountFilter = editorAccountFilterFromParams(await searchParams);
    return <EditorAccountsView accounts={await profileService.listEditorAccounts(filter)} filter={filter} />;
}
