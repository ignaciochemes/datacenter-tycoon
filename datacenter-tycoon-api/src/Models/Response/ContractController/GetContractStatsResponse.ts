export class GetContractStatsResponse {
    totalContracts: number;
    activeContracts: number;
    monthlyRevenue: number;
    totalPenalties: number;
    averageUptime: number;

    constructor(
        totalContracts: number,
        activeContracts: number,
        monthlyRevenue: number,
        totalPenalties: number,
        averageUptime: number
    ) {
        this.totalContracts = totalContracts;
        this.activeContracts = activeContracts;
        this.monthlyRevenue = monthlyRevenue;
        this.totalPenalties = totalPenalties;
        this.averageUptime = averageUptime;
    }
}