"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "../models/UserRole";

/** What client components may know about the signed-in user: enough to shape the screen, nothing secret. */
interface ICurrentUserInfo {
    role: UserRole;
    email: string;
}

const CurrentUserContext = createContext<ICurrentUserInfo | null>(null);

interface ICurrentUserProviderProps {
    /** The signed-in user, read on the server; null when nobody is signed in. */
    user: ICurrentUserInfo | null;
    children: React.ReactNode;
}

/**
 * Gives client components the signed-in user's role and email so they can show or hide actions. This only shapes the
 * screen: every page and server action checks the real session on the server.
 */
export default function CurrentUserProvider({ user, children }: ICurrentUserProviderProps) {
    return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

/** The signed-in user, or null when nobody is signed in. */
export function useCurrentUser(): ICurrentUserInfo | null {
    return useContext(CurrentUserContext);
}

/** The signed-in user's role. Falls back to the lowest role (viewer) when nobody is signed in. */
export function useCurrentRole(): UserRole {
    return useCurrentUser()?.role ?? "viewer";
}
