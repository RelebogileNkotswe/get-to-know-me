import sharp from "sharp";
import { PHOTO_CONTENT_TYPE, PHOTO_HEIGHT, PHOTO_WIDTH } from "../../models/Photo";
import { MAX_PHOTO_BYTES } from "../../models/ProfileForm";

/** Formats accepted for upload. The type is read from the file's own bytes, not from its name or what the browser says. */
const ACCEPTED_FORMATS: string[] = ["jpeg", "png", "webp"];

/** Refuses huge images that would use a lot of memory to open (about 40 megapixels). */
const MAX_INPUT_PIXELS = 40_000_000;

export type ProcessedPhoto = { ok: true; data: Buffer } | { ok: false; error: string };

/**
 * Checks an uploaded image and returns it ready to store: rotated the right way up, scaled to the portrait size,
 * converted to JPEG and compressed, with camera details and location data removed.
 */
export async function processPhoto(input: Uint8Array): Promise<ProcessedPhoto> {
    if (input.byteLength === 0) {
        return { ok: false, error: "That file is empty." };
    }
    if (input.byteLength > MAX_PHOTO_BYTES) {
        return { ok: false, error: "That photo is larger than 5 MB. Choose a smaller image." };
    }
    try {
        const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
        const { format } = await image.metadata();
        if (!format || !ACCEPTED_FORMATS.includes(format)) {
            return { ok: false, error: "Choose a JPG, PNG or WebP image." };
        }
        const data: Buffer = await image
            .rotate() // applies the camera's orientation, then the metadata is dropped
            .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: "cover" })
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
        return { ok: true, data };
    } catch {
        return { ok: false, error: "That file could not be read as an image. Try a different photo." };
    }
}

export { PHOTO_CONTENT_TYPE };
