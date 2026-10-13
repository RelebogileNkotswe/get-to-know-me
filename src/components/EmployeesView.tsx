"use client";

import Link from "next/link";
import { useState } from "react";
import { matchesEmployeeSearch, type EmployeeView, type IEmployee } from "../models/Employee";
import { hasRoleAtLeast } from "../models/UserRole";
import { useCurrentRole } from "./CurrentUserProvider";
import EmployeeCard from "./EmployeeCard";
import EmployeeCarousel from "./EmployeeCarousel";
import EmployeeToolbar from "./EmployeeToolbar";
import Icon from "./Icon";
import PersonCell from "./PersonCell";

interface IEmployeesViewProps {
    /** Published profiles, loaded on the server. */
    employees: IEmployee[];
}

/**
 * Employee list page body: the toolbar plus the employees shown as a table or as cards.
 */
export default function EmployeesView({ employees }: IEmployeesViewProps) {
    const [search, setSearch] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [view, setView] = useState<EmployeeView>("card");
    const [statusFilter, setStatusFilter] = useState<"all" | "linked" | "pending">("all");
    const showLinkStatus: boolean = hasRoleAtLeast(useCurrentRole(), "editor");

    const linkedCount = employees.filter((e) => e.hasAccount).length;
    const pendingCount = employees.filter((e) => !e.hasAccount).length;

    const searchText: string = search.trim().toLowerCase();
    const visibleEmployees: IEmployee[] = employees.filter((employee: IEmployee) => {
        const matchesSearch: boolean = matchesEmployeeSearch(employee, searchText);
        const matchesStartDate: boolean = startDate === "" || employee.startDate >= startDate;
        const matchesStatus: boolean =
            statusFilter === "all" ||
            (statusFilter === "linked" && employee.hasAccount) ||
            (statusFilter === "pending" && !employee.hasAccount);
        return matchesSearch && matchesStartDate && matchesStatus;
    });

    return (
        <>
            <EmployeeToolbar
                search={search}
                onSearchChange={setSearch}
                startDate={startDate}
                onStartDateChange={setStartDate}
                view={view}
                onViewChange={setView}
            />
            <div className="p-6">
                <EmployeeCarousel newStarters={employees.filter((employee: IEmployee) => employee.isNewStarter)} />

                {/* Status filter chips */}
                {showLinkStatus && (
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                        {(["all", "linked", "pending"] as const).map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setStatusFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    statusFilter === "all" && f === "all"
                                        ? "bg-brand-green text-brand-navy"
                                        : statusFilter === "linked" && f === "linked"
                                        ? "bg-brand-green text-brand-navy"
                                        : statusFilter === "pending" && f === "pending"
                                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                        : f === "pending"
                                        ? "bg-white/5 text-yellow-400/60 border border-white/10 hover:text-yellow-400 hover:border-yellow-500/20"
                                        : "bg-white/5 text-white/50 border border-white/10 hover:text-white hover:border-white/20"
                                }`}
                            >
                                {f === "all" && `All (${employees.length})`}
                                {f === "linked" && `Linked (${linkedCount})`}
                                {f === "pending" && `Pending (${pendingCount})`}
                            </button>
                        ))}
                    </div>
                )}

                {visibleEmployees.length === 0 && (
                    <p className="text-sm text-outline py-10 text-center">No employees match.</p>
                )}
                {visibleEmployees.length > 0 && view === "list" && (
                    <div className="bg-brand-navy-light border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-[10px] font-bold text-outline uppercase tracking-wider">
                                    <th className="text-left px-5 py-3">Name</th>
                                    <th className="text-left px-5 py-3">Position</th>
                                    <th className="text-left px-5 py-3">Start date</th>
                                    <th className="px-5 py-3"><span className="sr-only">View profile</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleEmployees.map((employee: IEmployee) => (
                                    <tr key={employee.id} className="border-b border-white/5 hover:bg-brand-navy/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <PersonCell name={employee.name} photoUrl={employee.photoUrl} />
                                        </td>
                                        <td className="px-5 py-3 text-on-surface-variant">{employee.position}</td>
                                        <td className="px-5 py-3 text-on-surface-variant">{employee.startDate}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Link
                                                href={`/employees/${employee.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/80 text-xs font-semibold hover:bg-brand-green hover:text-brand-navy hover:border-brand-green transition-all"
                                                aria-label={`View profile for ${employee.name}`}
                                            >
                                                <Icon name="visibility" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {visibleEmployees.length > 0 && view === "card" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visibleEmployees.map((employee: IEmployee) => (
                            <EmployeeCard key={employee.id} employee={employee} showLinkStatus={showLinkStatus} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
