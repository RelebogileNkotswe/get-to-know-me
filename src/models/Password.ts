/** Shortest password a user can set. */
export const MIN_PASSWORD_LENGTH = 12;

/** bcrypt only uses the first 72 bytes of a password, so longer ones are refused instead of silently cut. */
export const MAX_PASSWORD_BYTES = 72;

/** Returns an error message when the password is not acceptable, or null when it is fine. */
export function validatePassword(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
        return "Use a shorter password (at most 72 bytes).";
    }
    return null;
}
