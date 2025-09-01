export class CreateOperationalExpenseRequest {
    amount: number;
    expenseType: string;
    period: string;
    unitCost?: number;
    quantity?: number;
    unit?: string;
}