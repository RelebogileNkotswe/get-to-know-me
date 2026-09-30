/** An employee shown in the employee list. */
export interface IEmployee {
    id: string;
    name: string;
    position: string;
    /** ISO date, e.g. 2026-09-14. */
    startDate: string;
}

/** How the employee list is displayed. */
export type EmployeeView = "list" | "card";
