import { Contract } from '../../Entities/ContractEntity';

export class GetContractResponse {
    contract: Contract;

    constructor(contract: Contract) {
        this.contract = contract;
    }
}