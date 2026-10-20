import type { IAuditEvent, IAuditEventFilter } from "../../models/Audit";
import type { IPage } from "../../models/Paging";

/**
 * Contract for reading the audit log. Server-side only; callers must already have checked the admin role. Events are
 * written by the services that make each change (see logic/audit/AuditRecorder), never through this contract.
 */
export interface IAuditService {
    /**
     * Returns one page of the audit events that match the filter, newest first. Every word of the search must appear (in
     * any case) in the email of who did it or of who it was done to. Dates are days in the company's time zone; a date
     * that is not a valid ISO date is ignored.
     */
    listEvents(filter: IAuditEventFilter): Promise<IPage<IAuditEvent>>;
}
