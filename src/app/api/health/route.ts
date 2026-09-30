import { healthService } from "../../../logic/health/HealthService";

export function GET(): Response {
    return Response.json(healthService.getHealth());
}
