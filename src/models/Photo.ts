/** Photos are shown in a portrait frame, so the cropper is locked to this shape and every photo fits the template. */
export const PHOTO_ASPECT_RATIO = 4 / 5;

/** Size every saved photo is scaled to (width by height), keeping the portrait shape. Plenty for a card or the template, small to load. */
export const PHOTO_WIDTH = 800;
export const PHOTO_HEIGHT = 1000;

/** Format every saved photo is converted to, whatever was uploaded. */
export const PHOTO_CONTENT_TYPE = "image/jpeg";

/** Address a signed-in browser loads a profile's photo from. The version changes when the photo is replaced, so the old one is not shown. */
export function photoUrl(profileId: string, updatedAt: Date): string {
    return `/photos/${profileId}?v=${updatedAt.getTime()}`;
}
