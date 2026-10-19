"use client";

import {
    AuditAction,
    auditActionLabels,
    auditEventListPath,
    emptyAuditEventFilter,
    type AuditActionFilter,
    type IAuditEvent,
    type IAuditEventFilter,
} from "../models/Audit";
import type { IPage } from "../models/Paging";
import { ClientUtils } from "../utils/ClientUtils";
import AuditToolbar from "./AuditToolbar";
import Pagination from "./Pagination";
import { useServerFilter, type IServerFilter } from "./ServerFilter";

/** Actions that remove something or block someone, shown with a red badge so they stand out. */
const REMOVING_ACTIONS: AuditAction[] = [
    AuditAction.ProfileDeleted,
    AuditAction.InviteCancelled,
    AuditAction.AccountLocked,
];

interface IAuditLogViewProps {
    /** One page of the audit events that match the filter, newest first, loaded on the server. */
    events: IPage<IAuditEvent>;
    /** The filter the log was loaded with, read from the page address. */
    filter: IAuditEventFilter;
}

/**
 * Audit log page body: the toolbar plus a page of events showing who did what to which account or profile, and when.
 * The server filters and pages the log; the filter and page live in the page address.
 */
export default function AuditLogView({ events, filter }: IAuditLogViewProps) {
    const { inputs, isLoading, typeText, choose, clear }: IServerFilter<IAuditEventFilter> = useServerFilter(
        filter,
        auditEventListPath,
        emptyAuditEventFilter,
    );

    return (
        <>
            <AuditToolbar
                search={inputs.search}
                onSearchChange={(search: string) => typeText("search", search)}
                action={inputs.action}
                onActionChange={(action: AuditActionFilter) => choose("action", action)}
                from={inputs.from}
                onFromChange={(from: string) => choose("from", from)}
                to={inputs.to}
                onToChange={(to: string) => choose("to", to)}
                onClear={clear}
            />
            <div className="p-6">
                <h1 className="text-2xl font-semibold">Audit log</h1>
                <p className="text-base-content/70 mt-2 mb-6">
                    Who changed roles, accounts, profiles and invites, and when. Times are South African time.
                </p>
                <div
                    aria-busy={isLoading}
                    className={`overflow-x-auto transition-opacity ${isLoading ? "opacity-60" : ""}`}
                >
                    <table className="table-zebra table">
                        <thead>
                            <tr>
                                <th>When</th>
                                <th>Who</th>
                                <th>Action</th>
                                <th>Done to</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.items.map((event: IAuditEvent) => (
                                <tr key={event.id}>
                                    <td className="whitespace-nowrap">{ClientUtils.formatDateTime(event.createdAt)}</td>
                                    <td>{event.actor}</td>
                                    <td>
                                        <span
                                            className={`badge badge-sm whitespace-nowrap ${
                                                REMOVING_ACTIONS.includes(event.action) ? "badge-error" : "badge-ghost"
                                            }`}
                                        >
                                            {auditActionLabels[event.action]}
                                        </span>
                                    </td>
                                    <td>{event.targetEmail}</td>
                                    <td className="text-base-content/70">{event.summary || "—"}</td>
                                </tr>
                            ))}
                            {events.items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center">
                                        Nothing matches these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    page={events.page}
                    pageSize={events.pageSize}
                    totalCount={events.totalCount}
                    itemLabel="events"
                    onPageChange={(page: number) => choose("page", page)}
                    onPageSizeChange={(pageSize: number) => choose("pageSize", pageSize)}
                />
            </div>
        </>
    );
}
