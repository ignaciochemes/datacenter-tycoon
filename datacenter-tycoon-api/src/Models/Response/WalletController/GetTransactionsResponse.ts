import { Transaction } from '../../Entities/TransactionEntity';

export class GetTransactionsResponse {
    transactions: Transaction[];
    total: number;
}