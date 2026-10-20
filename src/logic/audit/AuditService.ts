import "server-only";
import type { IAuditService } from "../../interface/audit/AuditService";
import { AuditAction, AuditActorType, type IAuditEvent, type IAuditEventFilter } from "../../models/Audit";
import type { IPage } from "../../models/Paging";
import { profileFieldLabels, type IProfileFormValues } from "../../models/ProfileForm";
import { roleLabels } from "../../models/UserAccount";
import type { UserRole } from "../../models/UserRole";
import { db } from "../../prisma/Database";
import type { Prisma } from "../../prisma/generated/client";
import { ClientUtils } from "../../utils/ClientUtils";
import { ServerUtils } from "../../utils/ServerUtils";

const DAY_MS: number = 24 * 60 * 60 * 1000;

/** Who did it, as shown in the log. */
function actorLabel(actorType: AuditActorType, actorEmail: string | null): string {
    if (actorType === AuditActorType.System) {
        return "System";
    }
    return actorType === AuditActorType.Invitee ? `${actorEmail} (invite link)` : (actorEmail ?? "");
}

/** The event's details as a short sentence, e.g. "Viewer → Editor"; empty when the action says it all. */
function summarise(action: AuditAction, details: Prisma.JsonValue | null): string {
    const facts: Prisma.JsonObject =
        details !== null && typeof details === "object" && !Array.isArray(details) ? details : {};
    if (action === AuditAction.RoleChanged && typeof facts.from === "string" && typeof facts.to === "string") {
        return `${roleLabels[facts.from as UserRole] ?? facts.from} → ${roleLabels[facts.to as UserRole] ?? facts.to}`;
    }
    if (action === AuditAction.ProfileUpdated && Array.isArray(facts.fields)) {
        const labels: string[] = facts.fields.map(
            (field: Prisma.JsonValue) => profileFieldLabels[field as keyof IProfileFormValues] ?? String(field),
        );
        return `Changed: ${labels.join(", ")}`;
    }
    if (action === AuditAction.AccountLocked && typeof facts.failedSignInAttempts === "number") {
        return `${facts.failedSignInAttempts} wrong passwords in a row`;
    }
    return "";
}

/** One condition per search word: the word must appear, in any case, in the actor's or the target's email. */
function searchConditions(search: string): Prisma.AuditEventWhereInput[] {
    const conditions: Prisma.AuditEventWhereInput[] = [];
    for (const word of ServerUtils.searchWords(search)) {
        const contains = ServerUtils.containsText(word);
        conditions.push({ OR: [{ actorEmail: contains }, { targetEmail: contains }] });
    }
    return conditions;
}

export const auditService: IAuditService = {
    async listEvents(filter: IAuditEventFilter): Promise<IPage<IAuditEvent>> {
        const where: Prisma.AuditEventWhereInput = { AND: searchConditions(filter.search) };
        if (filter.action !== "all") {
            where.action = filter.action;
        }
        const createdAt: Prisma.DateTimeFilter<"AuditEvent"> = {};
        if (ClientUtils.isIsoDate(filter.from)) {
            createdAt.gte = ClientUtils.startOfCompanyDay(filter.from);
        }
        if (ClientUtils.isIsoDate(filter.to)) {
            // Up to the end of that day: before the next day starts.
            createdAt.lt = new Date(ClientUtils.startOfCompanyDay(filter.to).getTime() + DAY_MS);
        }
        if (createdAt.gte || createdAt.lt) {
            where.createdAt = createdAt;
        }

        const totalCount: number = await db.auditEvent.count({ where });
        const page: number = ClientUtils.clampPage(filter.page, totalCount, filter.pageSize);
        const events = await db.auditEvent.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * filter.pageSize,
            take: filter.pageSize,
        });
        const items: IAuditEvent[] = events.map((event) => {
            // The database only holds valid actions and actor types, so its values are these enums.
            const action = event.action as AuditAction;
            return {
                id: event.id,
                action,
                actor: actorLabel(event.actorType as AuditActorType, event.actorEmail),
                targetEmail: event.targetEmail,
                summary: summarise(action, event.details),
                createdAt: event.createdAt.toISOString(),
            };
        });
        return { items, page, pageSize: filter.pageSize, totalCount };
    },
};
