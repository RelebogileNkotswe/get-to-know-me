import Link from "next/link";
import type { IEmployee } from "../models/Employee";
import Icon from "./Icon";
import PersonPhoto from "./PersonPhoto";

interface IEmployeeCardProps {
    employee: IEmployee;
    /** Show the "Linked" or "Not yet linked" badge; only editors and admins see it. */
    showLinkStatus: boolean;
}

/**
 * One employee in the grid: initials in place of a photo, name, position, start date, a snippet of their
 * "Beyond the office gates" text, and an eye button that opens their profile.
 */
export default function EmployeeCard({ employee, showLinkStatus }: IEmployeeCardProps) {
    return (
        <div className="card card-border bg-base-100 shadow-sm">
            <div className="card-body gap-3">
                <div className="flex items-start justify-between gap-2">
                    <PersonPhoto
                        name={employee.name}
                        photoUrl={employee.photoUrl}
                        className="size-14 rounded-full"
                        initialsClassName="text-lg"
                    />
                    {showLinkStatus && (
                        <span className={`badge badge-sm ${employee.hasAccount ? "badge-success" : "badge-warning"}`}>
                            {employee.hasAccount ? "Linked" : "Not yet linked"}
                        </span>
                    )}
                </div>
                <div>
                    <h2 className="card-title">{employee.name}</h2>
                    <p>{employee.position}</p>
                    {employee.startDate && (
                        <p className="text-base-content/70 text-sm">Started {employee.startDate}</p>
                    )}
                </div>
                {employee.hobbies && (
                    <div className="bg-base-200 rounded-box p-3">
                        <p className="text-base-content/70 text-xs font-semibold tracking-wide uppercase">
                            Get to know me
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm italic">{employee.hobbies}</p>
                    </div>
                )}
                <div className="card-actions justify-end">
                    <Link
                        href={`/employees/${employee.id}`}
                        className="btn btn-outline btn-sm"
                        aria-label={`View profile for ${employee.name}`}
                    >
                        <Icon name="visibility" />
                        View profile
                    </Link>
                </div>
            </div>
        </div>
    );
}
