import AuditLogView from "../../../components/AuditLogView";
import { auditService } from "../../../logic/audit/AuditService";
import { requireUser } from "../../../logic/auth/RequireUser";
import { auditEventFilterFromParams, type IAuditEventFilter } from "../../../models/Audit";
import { UserRole } from "../../../models/UserRole";

export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit">) {
    await requireUser(UserRole.Admin);
    const filter: IAuditEventFilter = auditEventFilterFromParams(await searchParams);
    return <AuditLogView events={await auditService.listEvents(filter)} filter={filter} />;
}
