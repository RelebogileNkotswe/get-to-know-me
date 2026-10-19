import Link from "next/link";
import EmployeesView from "../components/EmployeesView";
import NoProfileNotice from "../components/NoProfileNotice";
import { requireUser } from "../logic/auth/RequireUser";
import { profileService } from "../logic/profiles/ProfileService";
import { employeeFilterFromParams, type IEmployeeFilter } from "../models/Employee";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";

export default async function Home({ searchParams }: PageProps<"/">) {
    const user = await requireUser();
    const filter: IEmployeeFilter = employeeFilterFromParams(await searchParams);
    const canReview: boolean = hasRoleAtLeast(user.role, UserRole.Editor);
    const [employees, newStarters, ownStatus, awaitingReview] = await Promise.all([
        profileService.listPublishedEmployees(filter),
        profileService.listNewStarters(filter),
        profileService.getOwnProfileStatus(user.email),
        canReview ? profileService.countAwaitingReview() : Promise.resolve(0),
    ]);

    return (
        <>
            {awaitingReview > 0 && (
                <div role="status" className="alert alert-warning alert-soft mx-6 mt-6">
                    <span>
                        {awaitingReview === 1
                            ? "A new joiner has submitted their profile and it is waiting for your review."
                            : `${awaitingReview} new joiners have submitted their profiles and they are waiting for your review.`}
                    </span>
                    <Link href="/editor/invites" className="btn btn-sm">
                        Review now
                    </Link>
                </div>
            )}
            {!ownStatus.hasProfile && <NoProfileNotice alreadyRequested={ownStatus.profileRequested} />}
            <EmployeesView employees={employees} newStarters={newStarters} filter={filter} />
        </>
    );
}
