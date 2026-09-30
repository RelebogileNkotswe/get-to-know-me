/** Result returned by the health check. */
export type HealthStatus = {
    status: "ok";
    service: "health";
    timestamp: string;
};

/** Contract for reporting application health. */
export interface IHealthService {
    /** Returns the current health status. */
    getHealth(): HealthStatus;
}
