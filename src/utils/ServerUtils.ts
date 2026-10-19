import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Shared helpers that run only on the server: they use Node.js crypto or read database errors. The "server-only" import
 * makes the build fail if a Client Component imports this file. Helpers that are safe in the browser live in ClientUtils.
 */
export class ServerUtils {
    /** Search text past this length is ignored, and so are words past the fifth, so one search cannot build a huge query. */
    private static readonly MAX_SEARCH_LENGTH = 100;
    private static readonly MAX_SEARCH_WORDS = 5;

    /**
     * The words of a list search. Each word is matched on its own, so "Sample One" finds the first name "Sample" with the
     * last name "One".
     */
    static searchWords(search: string): string[] {
        return search
            .slice(0, ServerUtils.MAX_SEARCH_LENGTH)
            .split(/\s+/)
            .filter((word: string) => word !== "")
            .slice(0, ServerUtils.MAX_SEARCH_WORDS);
    }

    /** A Prisma text filter that finds the word anywhere in a column, in any case. */
    static containsText(word: string): { contains: string; mode: "insensitive" } {
        return { contains: ServerUtils.escapeLikePattern(word), mode: "insensitive" };
    }

    /** A new random token for a session cookie or an invite link: 32 random bytes, so it cannot be guessed. */
    static generateToken(): string {
        return randomBytes(32).toString("base64url");
    }

    /** SHA-256 hash of a token. Only the hash is stored, so reading the database does not give anyone a working token. */
    static hashToken(token: string): string {
        return createHash("sha256").update(token).digest("hex");
    }

    /**
     * Text for a Prisma `contains` / `startsWith` / `endsWith` filter that matches it literally. Prisma passes the value to
     * SQL LIKE as it is, where % and _ are wildcards and \ escapes, so a search for "_" would otherwise match everything.
     */
    static escapeLikePattern(text: string): string {
        return text.replace(/[\\%_]/g, "\\$&");
    }

    /**
     * True when a Prisma error has this code (P2002: unique value already used, P2003: the related record no longer
     * exists, P2025: record not found).
     */
    static hasPrismaCode(error: unknown, code: string): boolean {
        return typeof error === "object" && error !== null && "code" in error && error.code === code;
    }
}
