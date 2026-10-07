import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import type { ChangePasswordResult, IAuthService, SignInResult } from "../../interface/auth/AuthService";
import type { ICurrentUser } from "../../models/CurrentUser";
import { validatePassword } from "../../models/Password";
import { ALLOWED_EMAIL_DOMAIN } from "../../models/ProfileForm";
import { SESSION_COOKIE } from "../../models/SessionCookie";
import { db } from "../../prisma/Database";
import { hashPassword, verifyPassword } from "./PasswordHasher";

/** How long a session lasts. TODO: the spec does not say; 8 hours is a placeholder. */
const SESSION_HOURS = 8;

/** Wrong passwords in a row that lock the account (spec: five). */
const MAX_FAILED_SIGN_IN_ATTEMPTS = 5;

const SIGN_IN_ERROR = "Invalid email or password, or the account is locked. Ask an admin if you cannot sign in.";

// Checked when the email is unknown, so unknown and known emails take about the same time to answer.
const dummyHash: Promise<string> = hashPassword("password-used-only-to-even-out-timing");

/** Only this hash of the token is stored, so reading the database does not give anyone a working token. */
function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/** Counts a wrong password and locks the account once it reaches the limit. */
async function recordFailedAttempt(userId: string): Promise<void> {
    const updated = await db.user.update({
        where: { id: userId },
        data: { failedSignInAttempts: { increment: 1 } },
    });
    if (updated.failedSignInAttempts >= MAX_FAILED_SIGN_IN_ATTEMPTS) {
        await db.user.update({ where: { id: userId }, data: { lockedAt: new Date() } });
    }
}

async function startSession(userId: string): Promise<void> {
    const token: string = randomBytes(32).toString("base64url");
    const expiresAt: Date = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
    await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
}

// Cached per request, so a page and its server components read the session from the database once.
const readCurrentUser = cache(async (): Promise<ICurrentUser | null> => {
    const token: string | undefined = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) {
        return null;
    }
    const session = await db.session.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: true },
    });
    if (!session || session.expiresAt <= new Date() || session.user.lockedAt !== null) {
        return null;
    }
    return { id: session.user.id, email: session.user.email, role: session.user.role };
});

export const authService: IAuthService = {
    async signIn(email: string, password: string): Promise<SignInResult> {
        const normalizedEmail: string = email.trim().toLowerCase();
        const user = normalizedEmail.endsWith(ALLOWED_EMAIL_DOMAIN)
            ? await db.user.findUnique({ where: { email: normalizedEmail } })
            : null;

        // Accounts that never set a password cannot sign in yet (first login is a separate flow).
        const canTryPassword: boolean = user !== null && user.passwordHash !== null && user.lockedAt === null;
        const passwordMatches: boolean = await verifyPassword(
            password,
            canTryPassword && user?.passwordHash ? user.passwordHash : await dummyHash,
        );

        if (!user || !canTryPassword || !passwordMatches) {
            if (user && canTryPassword) {
                await recordFailedAttempt(user.id);
            }
            return { ok: false, error: SIGN_IN_ERROR };
        }

        await db.user.update({
            where: { id: user.id },
            data: { failedSignInAttempts: 0, lastSignInAt: new Date() },
        });
        await startSession(user.id);
        return { ok: true };
    },

    async signOut(): Promise<void> {
        const cookieStore = await cookies();
        const token: string | undefined = cookieStore.get(SESSION_COOKIE)?.value;
        if (token) {
            await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
        }
        cookieStore.delete(SESSION_COOKIE);
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
        const current: ICurrentUser | null = await readCurrentUser();
        if (!current) {
            return { ok: false, errors: { currentPassword: "Your session has ended. Sign in again." } };
        }
        const user = await db.user.findUnique({ where: { id: current.id } });
        if (!user?.passwordHash) {
            return { ok: false, errors: { currentPassword: "This account has no password to change yet." } };
        }

        if (!(await verifyPassword(currentPassword, user.passwordHash))) {
            await recordFailedAttempt(user.id);
            return { ok: false, errors: { currentPassword: "That is not your current password." } };
        }
        const passwordError: string | null = validatePassword(newPassword);
        if (passwordError) {
            return { ok: false, errors: { newPassword: passwordError } };
        }
        if (newPassword === currentPassword) {
            return { ok: false, errors: { newPassword: "Choose a password different from your current one." } };
        }

        await db.user.update({
            where: { id: user.id },
            data: { passwordHash: await hashPassword(newPassword), failedSignInAttempts: 0 },
        });
        // Sign out every other browser, keeping this one, in case the old password was known to someone else.
        const token: string | undefined = (await cookies()).get(SESSION_COOKIE)?.value;
        await db.session.deleteMany({
            where: { userId: user.id, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) },
        });
        return { ok: true };
    },

    getCurrentUser: readCurrentUser,
};
