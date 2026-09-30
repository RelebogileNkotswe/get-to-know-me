import type { HealthStatus, IHealthService } from "../../interface/health/HealthService";

export const healthService: IHealthService = {
    getHealth(): HealthStatus {
        return { status: "ok", service: "health", timestamp: new Date().toISOString() };
    },
};
