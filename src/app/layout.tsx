import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import AppShell from "../components/AppShell";
import CurrentUserProvider from "../components/CurrentUserProvider";
import { authService } from "../logic/auth/AuthService";
import { profileService } from "../logic/profiles/ProfileService";
import { hasRoleAtLeast, UserRole } from "../models/UserRole";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["600", "700"],
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
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
        >
            <head>
                {/* Apply saved theme before React hydrates to prevent a flash of the wrong theme. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var t=localStorage.getItem('gtkm-theme');if(t==='brand-light')document.documentElement.dataset.theme='brand-light';})();`,
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
