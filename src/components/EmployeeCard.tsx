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
 * One employee in the grid: photo or initials, name, position, start date, a snippet of their
 * "Beyond the office gates" text, and an eye button that opens their profile.
 */
export default function EmployeeCard({ employee, showLinkStatus }: IEmployeeCardProps) {
    return (
        <div className="bg-base-200 border-base-300 hover:border-primary flex flex-col rounded-lg border transition-colors duration-200">
            <div className="p-5 flex flex-col gap-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <PersonPhoto
                        name={employee.name}
                        photoUrl={employee.photoUrl}
                        className="size-14 rounded-full ring-2 ring-base-300"
                        initialsClassName="text-lg"
                    />
                    {showLinkStatus && (
                        <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shrink-0 ${
                                employee.hasAccount
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-yellow-500/15 text-yellow-500 border border-yellow-500/25"
                            }`}
                        >
                            {employee.hasAccount ? "Linked" : "Not yet linked"}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-bold text-base-content leading-snug">{employee.name}</h2>
                    <p className="text-sm text-base-content/50">{employee.position}</p>
                    {employee.startDate && (
                        <p className="text-xs text-base-content/40 mt-0.5">Started {employee.startDate}</p>
                    )}
                </div>

                {employee.hobbies && (
                    <div className="bg-base-100 border-base-300 border-l-primary mt-auto rounded-lg border border-l-4 p-3">
                        <p className="text-base-content/60 mb-1.5 text-[10px] font-bold tracking-widest uppercase">
                            Get to know me
                        </p>
                        {/* Always two lines tall, so every card's box is the same size and the buttons line up. */}
                        <p className="text-base-content/80 line-clamp-2 h-[2lh] text-sm leading-relaxed italic">
                            {employee.hobbies}
                        </p>
                    </div>
                )}
            </div>

            <div className="px-5 pb-4">
                <Link
                    href={`/employees/${employee.id}`}
                    className="btn btn-ghost btn-sm hover:bg-primary hover:text-primary-content hover:border-primary w-full transition-all duration-150"
                    aria-label={`View profile for ${employee.name}`}
                >
                    <Icon name="visibility" />
                    View profile
                </Link>
            </div>
        </div>
    );
}
