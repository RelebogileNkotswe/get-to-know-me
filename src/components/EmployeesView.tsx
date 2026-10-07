"use client";

import Link from "next/link";
import { useState } from "react";
import { authService } from "../logic/auth/AuthService";
import type { EmployeeView, IEmployee } from "../models/Employee";
import { hasRoleAtLeast } from "../models/UserRole";
import EmployeeCard from "./EmployeeCard";
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
    const showLinkStatus: boolean = hasRoleAtLeast(authService.getCurrentRole(), "editor");

    const searchText: string = search.trim().toLowerCase();
    const visibleEmployees: IEmployee[] = employees.filter((employee: IEmployee) => {
        const matchesSearch: boolean =
            searchText === "" ||
            employee.name.toLowerCase().includes(searchText) ||
            employee.position.toLowerCase().includes(searchText) ||
            employee.hobbies.toLowerCase().includes(searchText);
        const matchesStartDate: boolean = startDate === "" || employee.startDate >= startDate;
        return matchesSearch && matchesStartDate;
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
                {visibleEmployees.length === 0 && <p className="text-base-content/70">No employees match.</p>}
                {visibleEmployees.length > 0 && view === "list" && (
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
                                {visibleEmployees.map((employee: IEmployee) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <PersonCell name={employee.name} />
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
