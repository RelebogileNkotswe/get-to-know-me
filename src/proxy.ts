import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "./models/SessionCookie";

/**
 * Quick first check: anyone without a session cookie is sent to the login page. This only looks for the cookie,
 * it does not prove the session is valid. Every page and server action checks the real session (see RequireUser).
 */
export function proxy(request: NextRequest) {
    if (request.cookies.has(SESSION_COOKIE)) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
    // Everything except the login page, the health check and Next.js static files.
    matcher: ["/((?!login|api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
