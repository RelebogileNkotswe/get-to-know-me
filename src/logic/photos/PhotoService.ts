import "server-only";
import type { IPhotoService, IStoredPhoto, SavePhotoResult } from "../../interface/photos/PhotoService";
import { AuditAction, type AuditActor } from "../../models/Audit";
import { photoUrl } from "../../models/Photo";
import { ProfileStatus } from "../../models/ProfileStatus";
import { db } from "../../prisma/Database";
import type { Prisma } from "../../prisma/generated/client";
import { ClientUtils } from "../../utils/ClientUtils";
import { ServerUtils } from "../../utils/ServerUtils";
import { recordAuditEvent } from "../audit/AuditRecorder";
import { PHOTO_CONTENT_TYPE, processPhoto } from "./PhotoProcessor";

export const photoService: IPhotoService = {
    async savePhoto(profileId: string, image: Uint8Array, actor: AuditActor): Promise<SavePhotoResult> {
        if (!ClientUtils.isUuid(profileId)) {
            return { ok: false, error: "That profile no longer exists." };
        }
        const processed = await processPhoto(image);
        if (!processed.ok) {
            return processed;
        }
        const data = new Uint8Array(processed.data);
        try {
            return await db.$transaction(async (tx: Prisma.TransactionClient): Promise<SavePhotoResult> => {
                const saved = await tx.profilePhoto.upsert({
                    where: { profileId },
                    create: { profileId, data, contentType: PHOTO_CONTENT_TYPE },
                    update: { data, contentType: PHOTO_CONTENT_TYPE },
                    select: { profile: { select: { companyEmail: true } } },
                });
                await recordAuditEvent(tx, {
                    action: AuditAction.PhotoSaved,
                    actor,
                    targetId: profileId,
                    targetEmail: saved.profile.companyEmail,
                });
                return { ok: true };
            });
        } catch (error) {
            // P2003: the profile was deleted while the photo was being sent.
            if (ServerUtils.hasPrismaCode(error, "P2003")) {
                return { ok: false, error: "That profile no longer exists." };
            }
            throw error;
        }
    },

    async getPhoto(profileId: string): Promise<IStoredPhoto | null> {
        if (!ClientUtils.isUuid(profileId)) {
            return null;
        }
        const photo = await db.profilePhoto.findUnique({
            where: { profileId },
            include: { profile: { select: { status: true } } },
        });
        if (!photo) {
            return null;
        }
        return {
            data: photo.data,
            contentType: photo.contentType,
            isPublished: photo.profile.status === ProfileStatus.Published,
        };
    },

    async getPhotoUrl(profileId: string): Promise<string | null> {
        if (!ClientUtils.isUuid(profileId)) {
            return null;
        }
        const photo = await db.profilePhoto.findUnique({ where: { profileId }, select: { updatedAt: true } });
        return photo ? photoUrl(profileId, photo.updatedAt) : null;
    },
};
