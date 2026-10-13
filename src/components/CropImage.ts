import type { Area } from "react-easy-crop";
import { PHOTO_ASPECT_RATIO, PHOTO_CONTENT_TYPE, PHOTO_WIDTH } from "../models/Photo";

/** Loads an image from an address so it can be drawn onto a canvas. */
function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The image could not be loaded."));
        image.src = source;
    });
}

/**
 * Cuts the chosen area out of the image and returns it as a JPEG in the portrait shape, no wider than the saved size.
 * This keeps the upload small; the server still checks and compresses the image again.
 */
export async function cropToJpeg(source: string, area: Area): Promise<Blob> {
    const image: HTMLImageElement = await loadImage(source);
    const width: number = Math.min(PHOTO_WIDTH, Math.round(area.width));
    const height: number = Math.round(width / PHOTO_ASPECT_RATIO);

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!context) {
        throw new Error("Cropping is not available in this browser.");
    }
    context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob: Blob | null) => (blob ? resolve(blob) : reject(new Error("The photo could not be prepared."))),
            PHOTO_CONTENT_TYPE,
            0.85,
        );
    });
}
