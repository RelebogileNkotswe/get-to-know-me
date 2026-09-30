import EmployeesView from "../components/EmployeesView";
import { profileService } from "../logic/profiles/ProfileService";

export default async function Home() {
    return <EmployeesView employees={await profileService.listPublishedEmployees()} />;
}
