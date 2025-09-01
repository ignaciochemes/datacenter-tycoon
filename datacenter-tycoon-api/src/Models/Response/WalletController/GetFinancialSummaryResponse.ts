export class GetFinancialSummaryResponse {
    balance: number;
    monthly: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    total: {
        revenue: number;
        expenses: number;
        profit: number;
    };
}