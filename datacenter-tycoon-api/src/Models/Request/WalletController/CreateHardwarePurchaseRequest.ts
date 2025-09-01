export class CreateHardwarePurchaseRequest {
    amount: number;
    deviceIds: number[];
    supplierId?: number;
    warrantyMonths?: number;
}