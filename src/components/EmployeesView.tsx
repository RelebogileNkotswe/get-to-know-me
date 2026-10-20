"use client";

import Link from "next/link";
import { useState } from "react";
import {
    emptyEmployeeFilter,
    employeeListPath,
    type EmployeeView,
    type IEmployee,
    type IEmployeeFilter,
} from "../models/Employee";
import type { IPage } from "../models/Paging";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";
import { useCurrentRole } from "./CurrentUserProvider";
import EmployeeCard from "./EmployeeCard";
import EmployeeCarousel from "./EmployeeCarousel";
import EmployeeToolbar from "./EmployeeToolbar";
import Icon from "./Icon";
import Pagination from "./Pagination";
import PersonCell from "./PersonCell";
import { useServerFilter, type IServerFilter } from "./ServerFilter";

interface IEmployeesViewProps {
    /** One page of the published profiles that match the filter, loaded on the server. */
    employees: IPage<IEmployee>;
    /** New starters that match the filter, for the carousel, loaded on the server. */
    newStarters: IEmployee[];
    /** The filter the list was loaded with, read from the page address. */
    filter: IEmployeeFilter;
}

/**
 * Employee list page body: the toolbar plus one page of employees shown as a table or as cards. The server filters and
 * pages the list; the filter and page live in the page address.
 */
export default function EmployeesView({ employees, newStarters, filter }: IEmployeesViewProps) {
    const { inputs, isLoading, typeText, choose, clear }: IServerFilter<IEmployeeFilter> = useServerFilter(
        filter,
        employeeListPath,
        emptyEmployeeFilter,
    );
    const [view, setView] = useState<EmployeeView>("card");
    const [statusFilter, setStatusFilter] = useState<"all" | "linked" | "pending">("all");
    const showLinkStatus: boolean = hasRoleAtLeast(useCurrentRole(), UserRole.Editor);
    const items: IEmployee[] = employees.items;

    const linkedCount = items.filter((e) => e.hasAccount).length;
    const pendingCount = items.filter((e) => !e.hasAccount).length;

    const visibleEmployees: IEmployee[] = items.filter((employee: IEmployee) =>
        statusFilter === "all" ||
        (statusFilter === "linked" && employee.hasAccount) ||
        (statusFilter === "pending" && !employee.hasAccount),
    );

    return (
        <>
            <EmployeeToolbar
                search={inputs.search}
                onSearchChange={(search: string) => typeText("search", search)}
                startDate={inputs.startedFrom}
                onStartDateChange={(startedFrom: string) => choose("startedFrom", startedFrom)}
                onClear={clear}
                view={view}
                onViewChange={setView}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
            />
            <div className="p-6">
                <EmployeeCarousel newStarters={newStarters} />
                <div aria-busy={isLoading} className={`transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                    {/* Status filter chips — client-side filter on the current page */}
                    {showLinkStatus && (
                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                            {(["all", "linked", "pending"] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setStatusFilter(f)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        statusFilter === f && f === "pending"
                                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                            : statusFilter === f
                                            ? "bg-brand-green text-brand-navy"
                                            : f === "pending"
                                            ? "bg-white/5 text-yellow-400/60 border border-white/10 hover:text-yellow-400 hover:border-yellow-500/20"
                                            : "bg-white/5 text-white/50 border border-white/10 hover:text-white hover:border-white/20"
                                    }`}
                                >
                                    {f === "all" && `All (${items.length})`}
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
                                            <td className="px-5 py-3 text-white/60">{employee.position}</td>
                                            <td className="px-5 py-3 text-white/60">{employee.startDate}</td>
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
                    <Pagination
                        page={employees.page}
                        pageSize={employees.pageSize}
                        totalCount={employees.totalCount}
                        itemLabel="employees"
                        onPageChange={(page: number) => choose("page", page)}
                        onPageSizeChange={(pageSize: number) => choose("pageSize", pageSize)}
                    />
                </div>
            </div>
        </>
    );
}
