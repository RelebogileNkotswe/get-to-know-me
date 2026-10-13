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
        <div className="bg-brand-navy-light border border-white/10 rounded-2xl flex flex-col hover:border-brand-green/25 hover:shadow-[0_0_20px_rgba(47,227,165,0.05)] transition-all duration-200">
            <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <PersonPhoto
                        name={employee.name}
                        photoUrl={employee.photoUrl}
                        className="size-14 rounded-full ring-2 ring-white/5"
                        initialsClassName="text-lg"
                    />
                    {showLinkStatus && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide shrink-0 ${
                            employee.hasAccount
                                ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                                : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"
                        }`}>
                            {employee.hasAccount ? "Linked" : "Not yet linked"}
                        </span>
                    )}
                </div>

                {/* Name & role */}
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-bold text-white leading-snug">{employee.name}</h2>
                    <p className="text-sm text-white/50">{employee.position}</p>
                    {employee.startDate && (
                        <p className="text-xs text-white/30 mt-0.5">Started {employee.startDate}</p>
                    )}
                </div>

                {/* Get to know me */}
                {employee.hobbies && (
                    <div className="bg-brand-navy rounded-xl p-3 border border-white/5">
                        <p className="text-[9px] font-bold tracking-widest uppercase text-brand-green/60 mb-1.5">
                            Get to know me
                        </p>
                        <p className="line-clamp-3 text-sm text-white/70 italic leading-relaxed">{employee.hobbies}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4">
                <Link
                    href={`/employees/${employee.id}`}
                    className="flex w-full items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 font-medium hover:bg-brand-green hover:text-brand-navy hover:border-brand-green transition-all duration-150"
                    aria-label={`View profile for ${employee.name}`}
                >
                    <Icon name="visibility" />
                    View profile
                </Link>
            </div>
        </div>
    );
}
