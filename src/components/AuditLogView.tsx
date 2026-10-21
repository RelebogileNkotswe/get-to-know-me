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
import Icon from "./Icon";
import Pagination from "./Pagination";
import { useServerFilter, type IServerFilter } from "./ServerFilter";

/** Actions that remove something or block someone, shown in red. */
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

            <div className="p-6 flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Audit log</h1>
                    <p className="text-white/50 mt-1.5 text-sm">
                        Who changed roles, accounts, profiles and invites, and when. Times are South African time.
                    </p>
                </div>

                <div aria-busy={isLoading} className={`flex flex-col gap-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                    {events.items.length === 0 ? (
                        <div className="bg-brand-navy-light border border-white/10 rounded-xl flex flex-col items-center justify-center py-16 gap-3">
                            <span className="flex size-12 items-center justify-center rounded-full bg-white/5 text-white/30">
                                <Icon name="history" className="text-[24px]" />
                            </span>
                            <p className="text-sm text-white/40">Nothing matches these filters.</p>
                        </div>
                    ) : (
                        <div className="bg-brand-navy-light border border-white/10 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] font-bold text-outline uppercase tracking-wider">
                                        <th className="text-left px-5 py-3">When</th>
                                        <th className="text-left px-5 py-3">Who</th>
                                        <th className="text-left px-5 py-3">Action</th>
                                        <th className="text-left px-5 py-3">Done to</th>
                                        <th className="text-left px-5 py-3">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.items.map((event: IAuditEvent) => (
                                        <tr key={event.id} className="border-b border-white/5 hover:bg-brand-navy/50 transition-colors">
                                            <td className="px-5 py-3 whitespace-nowrap text-white/50 text-xs">
                                                {ClientUtils.formatDateTime(event.createdAt)}
                                            </td>
                                            <td className="px-5 py-3 text-white/80 text-xs">{event.actor}</td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                                                        REMOVING_ACTIONS.includes(event.action)
                                                            ? "bg-error/15 text-error border border-error/25"
                                                            : "bg-white/5 text-white/60 border border-white/10"
                                                    }`}
                                                >
                                                    {auditActionLabels[event.action]}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-white/60 text-xs">{event.targetEmail}</td>
                                            <td className="px-5 py-3 text-white/40 text-xs">{event.summary || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination
                        page={events.page}
                        pageSize={events.pageSize}
                        totalCount={events.totalCount}
                        itemLabel="events"
                        onPageChange={(page: number) => choose("page", page)}
                        onPageSizeChange={(pageSize: number) => choose("pageSize", pageSize)}
                    />
                </div>
            </div>
        </>
    );
}
