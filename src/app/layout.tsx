import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import AppShell from "../components/AppShell";
import CurrentUserProvider from "../components/CurrentUserProvider";
import { authService } from "../logic/auth/AuthService";
import { profileService } from "../logic/profiles/ProfileService";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";
import "./globals.css";

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Get To Know Me",
    description: "Get To Know Me web application",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
    const user = await authService.getCurrentUser();
    const awaitingReviewCount: number =
        user && hasRoleAtLeast(user.role, UserRole.Editor) ? await profileService.countAwaitingReview() : 0;

    return (
        <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
            <head>
                {/* The light theme is the default; apply a saved dark choice before React hydrates to prevent a flash. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var t=localStorage.getItem('gtkm-theme');if(t==='brand')document.documentElement.dataset.theme='brand';})();`,
                    }}
                />
                {/* Root layout in the App Router applies to every page; Material Symbols is not offered by next/font. */}
                {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
                />
            </head>
            <body className="min-h-full bg-base-100">
                <CurrentUserProvider user={user ? { role: user.role, email: user.email, awaitingReviewCount } : null}>
                    {user ? <AppShell>{children}</AppShell> : children}
                </CurrentUserProvider>
            </body>
        </html>
    );
}
