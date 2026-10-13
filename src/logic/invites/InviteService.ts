import "server-only";
import type {
    CreateInviteResult,
    IInviteService,
    InviteLookup,
    SubmitInviteResult,
} from "../../interface/invites/InviteService";
import { INVITE_VALID_DAYS, type IPendingInvite } from "../../models/Invite";
import { validateProfileForm, type IProfileFormValues } from "../../models/ProfileForm";
import { db } from "../../prisma/Database";
import type { Invite, Profile } from "../../prisma/generated/client";
import { hasPrismaCode, toDatabaseData, uuidPattern } from "../profiles/ProfileMapping";
import { generateInviteToken, hashInviteToken } from "./InviteToken";

const LINK_NO_LONGER_WORKS = "This link no longer works.";

function newExpiry(): Date {
    return new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000);
}

function isoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
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
        startDate: profile.startDate ? isoDate(profile.startDate) : "",
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
        where: { tokenHash: hashInviteToken(token) },
        include: { profile: true },
    });
    if (!invite) {
        return { state: "invalid" };
    }
    if (invite.submittedAt !== null || invite.profile.status !== "invited") {
        return { state: "submitted" };
    }
    if (invite.expiresAt <= new Date()) {
        return { state: "expired" };
    }
    return { state: "open", invite, profile: invite.profile };
}

export const inviteService: IInviteService = {
    async createInvite(values: IProfileFormValues): Promise<CreateInviteResult> {
        const errors = validateProfileForm(values);
        if (Object.keys(errors).length > 0) {
            return { ok: false, errors };
        }
        const token: string = generateInviteToken();
        try {
            const profile = await db.profile.create({
                data: {
                    ...toDatabaseData(values),
                    status: "invited",
                    invite: { create: { tokenHash: hashInviteToken(token), expiresAt: newExpiry() } },
                },
            });
            return { ok: true, profileId: profile.id, token };
        } catch (error) {
            if (hasPrismaCode(error, "P2002")) {
                return { ok: false, errors: { companyEmail: "That email already has a profile or an invite." } };
            }
            throw error;
        }
    },

    async renewLink(profileId: string): Promise<string | null> {
        if (!uuidPattern.test(profileId)) {
            return null;
        }
        const token: string = generateInviteToken();
        // Only an invite that has not been submitted can be renewed; the old token stops working at once.
        const result = await db.invite.updateMany({
            where: { profileId, submittedAt: null, profile: { status: "invited" } },
            data: { tokenHash: hashInviteToken(token), expiresAt: newExpiry() },
        });
        return result.count > 0 ? token : null;
    },

    async cancelInvite(profileId: string): Promise<boolean> {
        if (!uuidPattern.test(profileId)) {
            return false;
        }
        // Only a profile still in the "invited" state is removed; a submitted one has the employee's answers and is reviewed instead.
        const result = await db.profile.deleteMany({ where: { id: profileId, status: "invited" } });
        return result.count > 0;
    },

    async listPendingInvites(): Promise<IPendingInvite[]> {
        const profiles = await db.profile.findMany({
            where: { status: { in: ["invited", "awaiting_review"] } },
            include: { invite: true },
            orderBy: { createdAt: "desc" },
        });
        const now: Date = new Date();
        return profiles.map((profile) => ({
            profileId: profile.id,
            name: fullName(profile),
            email: profile.companyEmail,
            position: profile.position,
            status: profile.status === "awaiting_review" ? "awaiting_review" : "invited",
            expiresOn: profile.invite ? isoDate(profile.invite.expiresAt) : "",
            isExpired: profile.status === "invited" && profile.invite !== null && profile.invite.expiresAt <= now,
            submittedOn: profile.invite?.submittedAt ? isoDate(profile.invite.submittedAt) : null,
        }));
    },

    async getInvite(token: string): Promise<InviteLookup> {
        const found = await findUsableInvite(token);
        return found.state === "open" ? { state: "open", values: toFormValues(found.profile) } : { state: found.state };
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

        const saved: boolean = await db.$transaction(async (tx) => {
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
                data: { ...toDatabaseData(submitted), status: "awaiting_review" },
            });
            return true;
        });
        return saved ? { ok: true } : { ok: false, errors: {}, linkProblem: LINK_NO_LONGER_WORKS };
    },
};
