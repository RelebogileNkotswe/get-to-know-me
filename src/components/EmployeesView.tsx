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
    const showLinkStatus: boolean = hasRoleAtLeast(useCurrentRole(), UserRole.Editor);
    const items: IEmployee[] = employees.items;

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
            />
            <div className="p-6">
                <EmployeeCarousel newStarters={newStarters} />
                <div aria-busy={isLoading} className={`transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                    {items.length === 0 && <p className="text-base-content/70">No employees match.</p>}
                    {items.length > 0 && view === "list" && (
                        <div className="overflow-x-auto">
                            <table className="table-zebra table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Position</th>
                                        <th>Start date</th>
                                        <th>
                                            <span className="sr-only">View profile</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((employee: IEmployee) => (
                                        <tr key={employee.id}>
                                            <td>
                                                <PersonCell name={employee.name} photoUrl={employee.photoUrl} />
                                            </td>
                                            <td>{employee.position}</td>
                                            <td>{employee.startDate}</td>
                                            <td>
                                                <Link
                                                    href={`/employees/${employee.id}`}
                                                    className="btn btn-ghost btn-sm btn-square"
                                                    aria-label={`View profile for ${employee.name}`}
                                                >
                                                    <Icon name="visibility" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {items.length > 0 && view === "card" && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {items.map((employee: IEmployee) => (
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
