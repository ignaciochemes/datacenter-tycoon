export class CreateSLAPenaltyRequest {
    contractId: number;
    amount: number;
    penaltyType: string;
    originalAmount: number;
    penaltyRate: number;
}