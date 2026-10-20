import "server-only";
import type {
    CreateInviteResult,
    IInviteService,
    IOpenInvite,
    InviteLookup,
    SubmitInviteResult,
} from "../../interface/invites/InviteService";
import { AuditAction, AuditActorType, type AuditActor } from "../../models/Audit";
import { INVITE_VALID_DAYS, type IPendingInvite } from "../../models/Invite";
import { validateProfileForm, type IProfileFormValues } from "../../models/ProfileForm";
import { ProfileStatus } from "../../models/ProfileStatus";
import { db } from "../../prisma/Database";
import type { Invite, Prisma, Profile } from "../../prisma/generated/client";
import { ClientUtils } from "../../utils/ClientUtils";
import { ServerUtils } from "../../utils/ServerUtils";
import { recordAuditEvent } from "../audit/AuditRecorder";
import { toDatabaseData } from "../profiles/ProfileMapping";

const LINK_NO_LONGER_WORKS = "This link no longer works.";

function newExpiry(): Date {
    return new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000);
}

function fullName(profile: Profile): string {
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.companyEmail;
}

function toFormValues(profile: Profile): IProfileFormValues {
    return {
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        preferredName: profile.preferredName ?? "",
        position: profile.position ?? "",
        startDate: ClientUtils.toUtcIsoDate(profile.startDate),
        companyEmail: profile.companyEmail,
        linkedIn: profile.linkedIn ?? "",
        hobbies: profile.hobbies ?? "",
        somethingInteresting: profile.somethingInteresting ?? "",
        background: profile.background ?? "",
    };
}

/** Finds the invite for a token and works out whether it can still be used. */
async function findUsableInvite(
    token: string,
): Promise<{ state: "open"; invite: Invite; profile: Profile } | { state: "submitted" | "expired" | "invalid" }> {
    if (token.length < 20 || token.length > 100) {
        return { state: "invalid" };
    }
    const invite = await db.invite.findUnique({
        where: { tokenHash: ServerUtils.hashToken(token) },
        include: { profile: true },
    });
    if (!invite) {
        return { state: "invalid" };
    }
    if (invite.submittedAt !== null || invite.profile.status !== ProfileStatus.Invited) {
        return { state: "submitted" };
    }
    if (invite.expiresAt <= new Date()) {
        return { state: "expired" };
    }
    return { state: "open", invite, profile: invite.profile };
}

export const inviteService: IInviteService = {
    async createInvite(values: IProfileFormValues, actor: AuditActor): Promise<CreateInviteResult> {
        const errors = validateProfileForm(values);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors };
        }
        const token: string = ServerUtils.generateToken();
        try {
            return await db.$transaction(async (tx: Prisma.TransactionClient): Promise<CreateInviteResult> => {
                const profile = await tx.profile.create({
                    data: {
                        ...toDatabaseData(values),
                        status: ProfileStatus.Invited,
                        invite: { create: { tokenHash: ServerUtils.hashToken(token), expiresAt: newExpiry() } },
                    },
                });
                await recordAuditEvent(tx, {
                    action: AuditAction.InviteCreated,
                    actor,
                    targetId: profile.id,
                    targetEmail: profile.companyEmail,
                });
                return { ok: true, profileId: profile.id, token };
            });
        } catch (error) {
            if (ServerUtils.hasPrismaCode(error, "P2002")) {
                return { ok: false, errors: { companyEmail: "That email already has a profile or an invite." } };
            }
            throw error;
        }
    },

    async renewLink(profileId: string, actor: AuditActor): Promise<string | null> {
        if (!ClientUtils.isUuid(profileId)) {
            return null;
        }
        const token: string = ServerUtils.generateToken();
        return db.$transaction(async (tx: Prisma.TransactionClient): Promise<string | null> => {
            // Only an invite that has not been submitted can be renewed; the old token stops working at once.
            const result = await tx.invite.updateMany({
                where: { profileId, submittedAt: null, profile: { status: ProfileStatus.Invited } },
                data: { tokenHash: ServerUtils.hashToken(token), expiresAt: newExpiry() },
            });
            if (result.count === 0) {
                return null;
            }
            const profile = await tx.profile.findUniqueOrThrow({
                where: { id: profileId },
                select: { companyEmail: true },
            });
            await recordAuditEvent(tx, {
                action: AuditAction.InviteRenewed,
                actor,
                targetId: profileId,
                targetEmail: profile.companyEmail,
            });
            return token;
        });
    },

    async cancelInvite(profileId: string, actor: AuditActor): Promise<boolean> {
        if (!ClientUtils.isUuid(profileId)) {
            return false;
        }
        return db.$transaction(async (tx: Prisma.TransactionClient): Promise<boolean> => {
            // The email is read first, because the record needs it after the profile is gone.
            const profile = await tx.profile.findUnique({ where: { id: profileId }, select: { companyEmail: true } });
            if (!profile) {
                return false;
            }
            // Only a profile still in the "invited" state is removed; a submitted one has the employee's answers and is reviewed instead.
            const result = await tx.profile.deleteMany({ where: { id: profileId, status: ProfileStatus.Invited } });
            if (result.count === 0) {
                return false;
            }
            await recordAuditEvent(tx, {
                action: AuditAction.InviteCancelled,
                actor,
                targetId: profileId,
                targetEmail: profile.companyEmail,
            });
            return true;
        });
    },

    async listPendingInvites(): Promise<IPendingInvite[]> {
        const profiles = await db.profile.findMany({
            where: { status: { in: [ProfileStatus.Invited, ProfileStatus.AwaitingReview] } },
            include: { invite: true },
            orderBy: { createdAt: "desc" },
        });
        const now: Date = new Date();
        return profiles.map((profile) => ({
            profileId: profile.id,
            name: fullName(profile),
            email: profile.companyEmail,
            position: profile.position,
            status:
                profile.status === ProfileStatus.AwaitingReview ? ProfileStatus.AwaitingReview : ProfileStatus.Invited,
            expiresOn: profile.invite ? ClientUtils.toUtcIsoDate(profile.invite.expiresAt) : "",
            isExpired:
                profile.status === ProfileStatus.Invited && profile.invite !== null && profile.invite.expiresAt <= now,
            submittedOn: profile.invite?.submittedAt ? ClientUtils.toUtcIsoDate(profile.invite.submittedAt) : null,
        }));
    },

    async getInvite(token: string): Promise<InviteLookup> {
        const found = await findUsableInvite(token);
        return found.state === "open" ? { state: "open", values: toFormValues(found.profile) } : { state: found.state };
    },

    async findOpenInvite(token: string): Promise<IOpenInvite | null> {
        const found = await findUsableInvite(token);
        return found.state === "open"
            ? { profileId: found.profile.id, companyEmail: found.profile.companyEmail }
            : null;
    },

    async submitInvite(token: string, values: IProfileFormValues): Promise<SubmitInviteResult> {
        const found = await findUsableInvite(token);
        if (found.state !== "open") {
            return { ok: false, errors: {}, linkProblem: LINK_NO_LONGER_WORKS };
        }

        // The email was entered by the editor and links the profile to the person's account, so the browser cannot change it.
        const submitted: IProfileFormValues = { ...values, companyEmail: found.profile.companyEmail };
        const errors = validateProfileForm(submitted);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors, linkProblem: null };
        }

        const saved: boolean = await db.$transaction(async (tx: Prisma.TransactionClient): Promise<boolean> => {
            // Marks the invite used first, so two submissions at once cannot both go through.
            const used = await tx.invite.updateMany({
                where: { id: found.invite.id, submittedAt: null },
                data: { submittedAt: new Date() },
            });
            if (used.count === 0) {
                return false;
            }
            await tx.profile.update({
                where: { id: found.profile.id },
                data: { ...toDatabaseData(submitted), status: ProfileStatus.AwaitingReview },
            });
            await recordAuditEvent(tx, {
                action: AuditAction.InviteSubmitted,
                actor: { type: AuditActorType.Invitee, email: found.profile.companyEmail },
                targetId: found.profile.id,
                targetEmail: found.profile.companyEmail,
            });
            return true;
        });
        return saved ? { ok: true } : { ok: false, errors: {}, linkProblem: LINK_NO_LONGER_WORKS };
    },
};
