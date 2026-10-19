import { ClientUtils, type SearchParams } from "../utils/ClientUtils";
import type { ICurrentUser } from "./CurrentUser";
import type { IPageRequest } from "./Paging";

/**
 * What an audit event records. Account actions are done to a user; the rest are done to a profile. The values match the
 * database's `AuditAction` enum.
 */
export enum AuditAction {
    RoleChanged = "role_changed",
    AccountUnlocked = "account_unlocked",
    AccountLocked = "account_locked",
    ProfileCreated = "profile_created",
    ProfileUpdated = "profile_updated",
    ProfilePublished = "profile_published",
    ProfileDeleted = "profile_deleted",
    PhotoSaved = "photo_saved",
    InviteCreated = "invite_created",
    InviteRenewed = "invite_renewed",
    InviteCancelled = "invite_cancelled",
    InviteSubmitted = "invite_submitted",
}

/** Text shown for each action, in the order the action filter lists them. */
export const auditActionLabels: Record<AuditAction, string> = {
    [AuditAction.RoleChanged]: "Role changed",
    [AuditAction.AccountUnlocked]: "Account unlocked",
    [AuditAction.AccountLocked]: "Account locked",
    [AuditAction.ProfileCreated]: "Profile created",
    [AuditAction.ProfileUpdated]: "Profile edited",
    [AuditAction.ProfilePublished]: "Profile published",
    [AuditAction.ProfileDeleted]: "Profile deleted",
    [AuditAction.PhotoSaved]: "Photo saved",
    [AuditAction.InviteCreated]: "Invite created",
    [AuditAction.InviteRenewed]: "Invite link renewed",
    [AuditAction.InviteCancelled]: "Invite cancelled",
    [AuditAction.InviteSubmitted]: "Invite submitted",
};

/** Kind of actor behind an audit event. The values match the database's `AuditActorType` enum. */
export enum AuditActorType {
    User = "user",
    Invitee = "invitee",
    System = "system",
}

/** Who did something: a signed-in user, a new joiner using their private invite link, or the system itself. */
export type AuditActor =
    | { type: AuditActorType.User; userId: string; email: string }
    | { type: AuditActorType.Invitee; email: string }
    | { type: AuditActorType.System };

/** The signed-in user as the actor of an audit event. */
export function userActor(user: ICurrentUser): AuditActor {
    return { type: AuditActorType.User, userId: user.id, email: user.email };
}

/** One row of the audit log as an admin sees it. */
export interface IAuditEvent {
    id: string;
    action: AuditAction;
    /** Who did it, e.g. "editor@singular.co.za", "new@singular.co.za (invite link)" or "System". */
    actor: string;
    /** Email of the user or profile it was done to, as it was at the time. */
    targetEmail: string;
    /** Short description of the change, e.g. "Viewer → Editor" or "Changed: Position, Start date"; empty when there is nothing more to say. */
    summary: string;
    /** When it happened, as an ISO timestamp. */
    createdAt: string;
}

/** Action choices in the audit log filter. */
export type AuditActionFilter = "all" | AuditAction;

/** What the audit log is filtered by, and which page of it to show. An empty string or "all" means that filter is not used. */
export interface IAuditEventFilter extends IPageRequest {
    /** Words to find in the email of who did it or of who it was done to. */
    search: string;
    action: AuditActionFilter;
    /** ISO date (e.g. 2026-09-14): only events on or after this day, in the company's time zone. */
    from: string;
    /** ISO date: only events on or before this day, in the company's time zone. */
    to: string;
}

/** Results per page on the audit log until the person picks another size. */
export const AUDIT_EVENT_PAGE_SIZE = 10;

export const emptyAuditEventFilter: IAuditEventFilter = {
    search: "",
    action: "all",
    from: "",
    to: "",
    page: 1,
    pageSize: AUDIT_EVENT_PAGE_SIZE,
};

/** The audit log filter in the page address. An unknown action shows every action. */
export function auditEventFilterFromParams(params: SearchParams): IAuditEventFilter {
    return {
        search: ClientUtils.firstSearchParam(params.search),
        action: ClientUtils.oneOf(
            ClientUtils.firstSearchParam(params.action),
            ["all", ...Object.values(AuditAction)],
            "all",
        ),
        from: ClientUtils.firstSearchParam(params.from),
        to: ClientUtils.firstSearchParam(params.to),
        page: ClientUtils.pageNumberFrom(ClientUtils.firstSearchParam(params.page)),
        pageSize: ClientUtils.pageSizeFrom(ClientUtils.firstSearchParam(params.pageSize), AUDIT_EVENT_PAGE_SIZE),
    };
}

/** Address of the audit log filtered by these values. Unused filters are left out of the address. */
export function auditEventListPath(filter: IAuditEventFilter): string {
    return ClientUtils.pathWithParams("/admin/audit", filter, emptyAuditEventFilter);
}
