import "server-only";
import { AuditActorType, type AuditAction, type AuditActor } from "../../models/Audit";
import type { Prisma } from "../../prisma/generated/client";

/** One thing to record in the audit log. */
export interface IAuditEntry {
    action: AuditAction;
    actor: AuditActor;
    /** The user or profile the action was done to. */
    targetId: string;
    /** The target's email now, kept so the record stays readable after the target is deleted. */
    targetEmail: string;
    /** Facts about the change, such as `{ from: "viewer", to: "editor" }`. Never field values. */
    details?: Prisma.InputJsonObject;
}

/**
 * Adds an event to the audit log. Pass the transaction the change itself runs in, so the change and its record are saved
 * together or not at all.
 */
export async function recordAuditEvent(tx: Prisma.TransactionClient, entry: IAuditEntry): Promise<void> {
    await tx.auditEvent.create({
        data: {
            action: entry.action,
            actorType: entry.actor.type,
            actorUserId: entry.actor.type === AuditActorType.User ? entry.actor.userId : null,
            actorEmail: entry.actor.type === AuditActorType.System ? null : entry.actor.email,
            targetId: entry.targetId,
            targetEmail: entry.targetEmail,
            details: entry.details,
        },
    });
}
