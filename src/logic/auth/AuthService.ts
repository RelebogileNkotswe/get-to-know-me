import type { IAuthService } from "../../interface/auth/AuthService";
import type { UserRole } from "../../models/UserRole";

export const authService: IAuthService = {
    logOut(): void {
        // TODO: end the user's session and return to the login page once authentication is added to the project.
    },

    getCurrentRole(): UserRole {
        // TODO: read the signed-in user's role once authentication is added. "admin" shows every entry and action for now.
        return "admin";
    },
};
