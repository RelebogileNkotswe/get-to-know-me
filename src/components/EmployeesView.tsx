"use client";

import Image from "next/image";
import { useState } from "react";
import type { EmployeeView, IEmployee } from "../models/Employee";
import EmployeeToolbar from "./EmployeeToolbar";
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
    const [view, setView] = useState<EmployeeView>("list");

    const searchText: string = search.trim().toLowerCase();
    const visibleEmployees: IEmployee[] = employees.filter((employee: IEmployee) => {
        const matchesSearch: boolean =
            searchText === "" ||
            employee.name.toLowerCase().includes(searchText) ||
            employee.position.toLowerCase().includes(searchText);
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {visibleEmployees.length > 0 && view === "card" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visibleEmployees.map((employee: IEmployee) => (
                            <div key={employee.id} className="card card-border bg-base-100 shadow-sm">
                                <figure className="bg-base-200 pt-6">
                                    <div className="avatar">
                                        <div className="w-24 rounded-full">
                                            <Image
                                                src="/avatar-placeholder.svg"
                                                alt={employee.name + " profile picture"}
                                                width={96}
                                                height={96}
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                </figure>
                                <div className="card-body">
                                    <h2 className="card-title">{employee.name}</h2>
                                    <p>{employee.position}</p>
                                    <p className="text-base-content/70 text-sm">Started {employee.startDate}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
