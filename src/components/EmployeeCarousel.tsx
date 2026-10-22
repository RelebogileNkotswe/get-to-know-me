import Link from "next/link";
import type { IEmployee } from "../models/Employee";
import PersonPhoto from "./PersonPhoto";

/** With fewer cards than this the row would not fill the width, so it stays still instead of looping. */
const MIN_CARDS_TO_MOVE = 4;

/** Seconds each card adds to one full loop, which keeps the speed slow and the same however many cards there are. */
const SECONDS_PER_CARD = 8;

interface IEmployeeCarouselProps {
    /** People who started in the last 30 days. */
    newStarters: IEmployee[];
}

interface IStarterCardProps {
    employee: IEmployee;
    /** The looping copy is hidden from screen readers and from the tab order. */
    isCopy: boolean;
}

function StarterCard({ employee, isCopy }: IStarterCardProps) {
    const displayName: string = employee.preferredName || employee.name;
    return (
        <Link
            href={`/employees/${employee.id}`}
            className="bg-base-200 border border-base-300 rounded-xl w-56 shrink-0 hover:border-primary/30 transition-colors"
            tabIndex={isCopy ? -1 : undefined}
        >
            <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="relative">
                    <PersonPhoto name={employee.name} photoUrl={employee.photoUrl} className="size-16 rounded-full" />
                    <span className="absolute -right-2 -bottom-1 px-1.5 py-0.5 rounded-full bg-brand-green text-brand-navy text-[10px] font-bold">
                        New
                    </span>
                </div>
                <h3 className="font-semibold text-base-content text-sm">{displayName}</h3>
                <p className="text-xs text-base-content/50">{employee.position}</p>
            </div>
        </Link>
    );
}

/**
 * Slow-moving row of cards for people who started in the last 30 days, shown above the full list. It pauses when pointed
 * at or touched, stays still for people who prefer reduced motion, and is not shown when nobody is new.
 */
export default function EmployeeCarousel({ newStarters }: IEmployeeCarouselProps) {
    if (newStarters.length === 0) {
        return null;
    }
    const isMoving: boolean = newStarters.length >= MIN_CARDS_TO_MOVE;

    return (
        <section aria-label="New starters" className="mb-6">
            <h2 className="mb-3 text-lg font-semibold text-base-content">Welcome our new starters</h2>
            <div className="new-starters-viewport">
                <div
                    className={`new-starters-track ${isMoving ? "is-moving" : ""}`}
                    style={
                        {
                            "--new-starters-duration": `${newStarters.length * SECONDS_PER_CARD}s`,
                        } as React.CSSProperties
                    }
                >
                    <div className="new-starters-group">
                        {newStarters.map((employee: IEmployee) => (
                            <StarterCard key={employee.id} employee={employee} isCopy={false} />
                        ))}
                    </div>
                    {isMoving && (
                        <div className="new-starters-group" aria-hidden="true">
                            {newStarters.map((employee: IEmployee) => (
                                <StarterCard key={employee.id} employee={employee} isCopy />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
