/** Outcome of saving a photo: success, or a message that can be shown to the person who uploaded it. */
export type SavePhotoResult = { ok: true } | { ok: false; error: string };

/** A stored photo, ready to send to a browser. */
export interface IStoredPhoto {
    data: Uint8Array;
    contentType: string;
    /** True when the profile it belongs to is published, so every signed-in user may see it. */
    isPublished: boolean;
}

/**
 * Contract for storing and reading employee photos. Server-side only. Where the bytes are kept is hidden behind this
 * contract (the database for now), so moving to object storage later changes one file.
 */
export interface IPhotoService {
    /**
     * Checks the image, scales it to the portrait size, compresses it and stores it, replacing any earlier photo.
     * Refuses files over 5 MB and anything that is not a real JPG, PNG or WebP image, whatever the browser claims.
     */
    savePhoto(profileId: string, image: Uint8Array): Promise<SavePhotoResult>;

    /** Returns the stored photo, or null when the profile has none. */
    getPhoto(profileId: string): Promise<IStoredPhoto | null>;

    /** Returns the address to load the profile's photo from, or null when it has none. */
    getPhotoUrl(profileId: string): Promise<string | null>;
}
