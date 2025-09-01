export class CreateContractPaymentRequest {
    contractId: number;
    amount: number;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    penalties?: number;
    discounts?: number;
}