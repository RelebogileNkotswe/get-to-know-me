import type { Area } from "react-easy-crop";
import { PHOTO_ASPECT_RATIO, PHOTO_CONTENT_TYPE, PHOTO_WIDTH } from "../models/Photo";

/** The query values a page receives from its address, in the shape of Next.js `searchParams`. */
export type SearchParams = { [key: string]: string | string[] | undefined };

/**
 * Shared helpers that are safe to use in the browser, so Client Components and server code can both import them.
 * Helpers that need Node.js or must stay on the server live in ServerUtils.
 */
export class ClientUtils {
    /** Ids come from URLs; anything that is not a UUID cannot match a row and would make Postgres reject the query. */
    private static readonly uuidPattern: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    /** True when the value is a UUID, such as a profile or user id. */
    static isUuid(value: string): boolean {
        return ClientUtils.uuidPattern.test(value);
    }

    /** Trimmed text, or null when nothing was entered (the database stores "not entered" as null). */
    static toNullable(value: string): string | null {
        const trimmed: string = value.trim();
        return trimmed === "" ? null : trimmed;
    }

    /** The value of a page address parameter, which can appear more than once; the first value is used, or "" when absent. */
    static firstSearchParam(value: string | string[] | undefined): string {
        if (Array.isArray(value)) {
            return value[0] ?? "";
        }
        return value ?? "";
    }

    /** The value when it is one of the options, otherwise the fallback. For address values that pick from a fixed list. */
    static oneOf<T extends string>(value: string, options: readonly T[], fallback: T): T {
        return (options as readonly string[]).includes(value) ? (value as T) : fallback;
    }

    /** The path with each value that differs from its default added as a query parameter, e.g. "/admin?role=editor". */
    static pathWithParams<T extends { [K in keyof T]: string | number }>(path: string, values: T, defaults: T): string {
        const params = new URLSearchParams();
        for (const key of Object.keys(values) as (keyof T & string)[]) {
            if (values[key] !== defaults[key]) {
                params.set(key, String(values[key]));
            }
        }
        const query: string = params.toString();
        return query === "" ? path : `${path}?${query}`;
    }

    /** How many results a list can show per page; the person picks one of these. */
    static readonly pageSizes: readonly number[] = [10, 20, 50, 100];

    /** The page size in a page address value when it is one of the allowed sizes, otherwise the list's default size. */
    static pageSizeFrom(value: string, defaultSize: number): number {
        const size: number = Number(value);
        return ClientUtils.pageSizes.includes(size) ? size : defaultSize;
    }

    /** The page number in a page address value when it is a whole number of 1 or more, otherwise 1. */
    static pageNumberFrom(value: string): number {
        const page: number = Number(value);
        return Number.isSafeInteger(page) && page >= 1 ? page : 1;
    }

    /** How many pages the results fill; an empty list still has one (empty) page. */
    static pageCount(totalCount: number, pageSize: number): number {
        return Math.max(1, Math.ceil(totalCount / pageSize));
    }

    /** The requested page, moved back to the last page when it is past the end of the results. */
    static clampPage(page: number, totalCount: number, pageSize: number): number {
        return Math.min(page, ClientUtils.pageCount(totalCount, pageSize));
    }

    /** Up to two initials of a name, shown in place of a photo. */
    static getInitials(name: string): string {
        const parts: string[] = name
            .trim()
            .split(/\s+/)
            .filter((part: string) => part !== "");
        return parts
            .slice(0, 2)
            .map((part: string) => part.charAt(0).toUpperCase())
            .join("");
    }

    /** Formats a date as a local ISO date string, e.g. 2026-09-14. */
    static toIsoDate(date: Date): string {
        const month: string = String(date.getMonth() + 1).padStart(2, "0");
        const day: string = String(date.getDate()).padStart(2, "0");
        return `${date.getFullYear()}-${month}-${day}`;
    }

    /** Parses an ISO date string (e.g. 2026-09-14) as a local date; returns undefined for an empty string. */
    static fromIsoDate(isoDate: string): Date | undefined {
        if (isoDate === "") {
            return undefined;
        }
        const [year, month, day] = isoDate.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    /** ISO date (e.g. 2026-09-14) of a date read from the database, which stores dates in UTC; an empty string for null. */
    static toUtcIsoDate(value: Date | null): string {
        return value ? value.toISOString().slice(0, 10) : "";
    }

    /** The date an ISO date (e.g. 2026-09-14) stands for, at midnight UTC, the way the database stores dates. */
    static fromUtcIsoDate(isoDate: string): Date {
        return new Date(`${isoDate}T00:00:00Z`);
    }

    /** True when the value is a real calendar date written as YYYY-MM-DD. */
    static isIsoDate(value: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    /** ISO date such as 2026-10-07 shown as "7 October 2026". */
    static formatLongDate(isoDate: string): string {
        return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        });
    }

    /**
     * Cuts the chosen area out of the image and returns it as a JPEG in the portrait shape, no wider than the saved size.
     * This keeps the upload small; the server still checks and compresses the image again. Browser only (uses a canvas).
     */
    static async cropToJpeg(source: string, area: Area): Promise<Blob> {
        const image: HTMLImageElement = await ClientUtils.loadImage(source);
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

    /** Loads an image from an address so it can be drawn onto a canvas. */
    private static loadImage(source: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("The image could not be loaded."));
            image.src = source;
        });
    }
}
