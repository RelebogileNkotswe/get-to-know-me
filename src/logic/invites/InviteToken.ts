import { createHash, randomBytes } from "node:crypto";

/** A new random token for an invite link: 32 random bytes, so it cannot be guessed. */
export function generateInviteToken(): string {
    return randomBytes(32).toString("base64url");
}

/** Only this hash of the token is stored, so reading the database does not give anyone a working link. */
export function hashInviteToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}
