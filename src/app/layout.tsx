import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "../components/AppShell";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Get To Know Me",
    description: "Get To Know Me web application",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <head>
                {/* Root layout in the App Router applies to every page; Material Symbols is not offered by next/font. */}
                {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
                />
            </head>
            <body className="min-h-full">
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
