import EmployeesView from "../components/EmployeesView";
import NoProfileNotice from "../components/NoProfileNotice";
import { requireUser } from "../logic/auth/RequireUser";
import { profileService } from "../logic/profiles/ProfileService";

export default async function Home() {
    const user = await requireUser();
    const [employees, ownStatus] = await Promise.all([
        profileService.listPublishedEmployees(),
        profileService.getOwnProfileStatus(user.email),
    ]);

    return (
        <>
            {!ownStatus.hasProfile && <NoProfileNotice alreadyRequested={ownStatus.profileRequested} />}
            <EmployeesView employees={employees} />
        </>
    );
}
