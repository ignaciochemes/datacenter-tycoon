import { Contract } from '../../Entities/ContractEntity';

export class GetContractsResponse {
    contracts: Contract[];
    total: number;

    constructor(contracts: Contract[]) {
        this.contracts = contracts;
        this.total = contracts.length;
    }
}