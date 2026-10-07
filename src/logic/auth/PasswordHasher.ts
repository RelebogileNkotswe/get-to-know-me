import bcrypt from "bcryptjs";

// Not marked "server-only" because the seed script (run with tsx, outside Next.js) also hashes passwords.
// Never import this from a Client Component.

/** bcrypt cost factor: each extra step doubles the time to hash, which slows down guessing. */
const BCRYPT_COST = 12;

/** Returns a salted bcrypt hash of the password. Only the hash is ever stored. */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
}

/** True when the password matches the stored hash. */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
}
