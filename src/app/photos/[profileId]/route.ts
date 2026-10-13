import type { NextRequest } from "next/server";
import { authService } from "../../../logic/auth/AuthService";
import { photoService } from "../../../logic/photos/PhotoService";
import { hasRoleAtLeast } from "../../../models/UserRole";

/**
 * Sends a profile's photo to a signed-in user. Photos are never public: anyone not signed in gets nothing, and a viewer
 * only gets the photo of a published profile. Editors and admins can also see photos on profiles still being reviewed.
 */
export async function GET(_request: NextRequest, context: RouteContext<"/photos/[profileId]">) {
    const user = await authService.getCurrentUser();
    if (!user) {
        return new Response(null, { status: 401 });
    }

    const { profileId } = await context.params;
    const photo = await photoService.getPhoto(profileId);
    if (!photo || (!photo.isPublished && !hasRoleAtLeast(user.role, "editor"))) {
        return new Response(null, { status: 404 });
    }

    return new Response(photo.data as BodyInit, {
        headers: {
            "Content-Type": photo.contentType,
            // The address carries a version that changes when the photo is replaced, so it is safe to keep for a day.
            // "private" stops shared caches from storing a photo that only signed-in users may see.
            "Cache-Control": "private, max-age=86400",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
