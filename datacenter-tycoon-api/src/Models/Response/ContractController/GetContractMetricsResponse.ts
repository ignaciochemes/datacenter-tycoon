export interface ContractMetrics {
    contractId: number;
    currentPeriodUptimePercent: number;
    currentPeriodAvgLatencyMs: number;
    currentPeriodAvgThroughputMbps: number;
    currentPeriodIncidentCount: number;
    currentPeriodPenalties: number;
    slaCompliance: {
        uptimeCompliant: boolean;
        latencyCompliant: boolean;
        throughputCompliant: boolean;
    };
    revenue: {
        monthlyRevenue: number;
        totalRevenue: number;
        penaltiesApplied: number;
        netRevenue: number;
    };
    nextBillingDate: Date;
    daysUntilExpiry: number;
}

export class GetContractMetricsResponse {
    metrics: ContractMetrics;

    constructor(metrics: ContractMetrics) {
        this.metrics = metrics;
    }
}