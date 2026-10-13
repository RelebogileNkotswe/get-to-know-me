import "server-only";
import type { IPhotoService, IStoredPhoto, SavePhotoResult } from "../../interface/photos/PhotoService";
import { photoUrl } from "../../models/Photo";
import { db } from "../../prisma/Database";
import { hasPrismaCode, uuidPattern } from "../profiles/ProfileMapping";
import { PHOTO_CONTENT_TYPE, processPhoto } from "./PhotoProcessor";

export const photoService: IPhotoService = {
    async savePhoto(profileId: string, image: Uint8Array): Promise<SavePhotoResult> {
        if (!uuidPattern.test(profileId)) {
            return { ok: false, error: "That profile no longer exists." };
        }
        const processed = await processPhoto(image);
        if (!processed.ok) {
            return processed;
        }
        const data = new Uint8Array(processed.data);
        try {
            await db.profilePhoto.upsert({
                where: { profileId },
                create: { profileId, data, contentType: PHOTO_CONTENT_TYPE },
                update: { data, contentType: PHOTO_CONTENT_TYPE },
            });
            return { ok: true };
        } catch (error) {
            // P2003: the profile was deleted while the photo was being sent.
            if (hasPrismaCode(error, "P2003")) {
                return { ok: false, error: "That profile no longer exists." };
            }
            throw error;
        }
    },

    async getPhoto(profileId: string): Promise<IStoredPhoto | null> {
        if (!uuidPattern.test(profileId)) {
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
            isPublished: photo.profile.status === "published",
        };
    },

    async getPhotoUrl(profileId: string): Promise<string | null> {
        if (!uuidPattern.test(profileId)) {
            return null;
        }
        const photo = await db.profilePhoto.findUnique({ where: { profileId }, select: { updatedAt: true } });
        return photo ? photoUrl(profileId, photo.updatedAt) : null;
    },
};
