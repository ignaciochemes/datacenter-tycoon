import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../Models/Entities/ContractEntity';
import { WalletService } from './WalletService';
import { ContractService } from './ContractService';
import { ContractStatus } from '../Enums/SystemEnum';

export interface ContractRevenueResult {
    contractId: number;
    revenueApplied: number;
    penaltiesApplied: number;
    netRevenue: number;
    slaCompliant: boolean;
}

export interface RevenueProcessingResult {
    totalRevenue: number;
    totalPenalties: number;
    netRevenue: number;
    contractsProcessed: number;
    results: ContractRevenueResult[];
}

@Injectable()
export class ContractRevenueService {
    private readonly logger = new Logger(ContractRevenueService.name);

    constructor(
        @InjectRepository(Contract)
        private readonly contractRepository: Repository<Contract>,
        private readonly walletService: WalletService,
        private readonly contractService: ContractService
    ) {}

    async processMonthlyRevenue(): Promise<RevenueProcessingResult> {
        this.logger.log('Starting monthly revenue processing...');
        
        const activeContracts = await this.getActiveContracts();
        const results: ContractRevenueResult[] = [];
        let totalRevenue = 0;
        let totalPenalties = 0;

        for (const contract of activeContracts) {
            try {
                const result = await this.processContractRevenue(contract);
                results.push(result);
                totalRevenue += result.revenueApplied;
                totalPenalties += result.penaltiesApplied;
            } catch (error) {
                this.logger.error(`Error processing contract ${contract.id}: ${error.message}`);
            }
        }

        const netRevenue = totalRevenue - totalPenalties;
        
        this.logger.log(`Monthly revenue processing completed. Revenue: $${totalRevenue}, Penalties: $${totalPenalties}, Net: $${netRevenue}`);
        
        return {
            totalRevenue,
            totalPenalties,
            netRevenue,
            contractsProcessed: results.length,
            results
        };
    }

    async processContractRevenue(contract: Contract): Promise<ContractRevenueResult> {
        const contractMetrics = await this.contractService.getContractMetrics(contract.id);
        const slaStatus = await this.contractService.getSLAStatus(contract.id);
        
        const baseRevenue = contract.monthlyPrice;
        let penaltiesApplied = 0;
        
        if (!slaStatus.compliance.uptimeCompliant || 
            !slaStatus.compliance.latencyCompliant || 
            !slaStatus.compliance.throughputCompliant) {
            
            await this.contractService.applyPenalties(contract.id);
            
            const updatedContract = await this.contractRepository.findOne({
                where: { id: contract.id }
            });
            
            penaltiesApplied = updatedContract?.currentPeriodPenalties || 0;
            
            if (penaltiesApplied > 0) {
                await this.walletService.createSLAPenalty(
                    contract.userId.id,
                    contract.id,
                    penaltiesApplied,
                    this.getSLAViolationType(slaStatus),
                    baseRevenue,
                    this.calculatePenaltyRate(contract, penaltiesApplied)
                );
            }
        }
        
        const billingPeriodStart = this.getCurrentBillingPeriodStart();
        const billingPeriodEnd = this.getCurrentBillingPeriodEnd();
        
        await this.walletService.createContractPayment(
            contract.userId.id,
            contract.id,
            baseRevenue,
            billingPeriodStart,
            billingPeriodEnd,
            penaltiesApplied,
            0
        );
        
        await this.resetContractPeriodMetrics(contract);
        
        const netRevenue = baseRevenue - penaltiesApplied;
        
        return {
            contractId: contract.id,
            revenueApplied: baseRevenue,
            penaltiesApplied,
            netRevenue,
            slaCompliant: slaStatus.compliance.uptimeCompliant && 
                         slaStatus.compliance.latencyCompliant && 
                         slaStatus.compliance.throughputCompliant
        };
    }

    async processContractsByTick(): Promise<RevenueProcessingResult> {
        this.logger.log('Processing contract revenue by tick...');
        
        const contractsDueForBilling = await this.getContractsDueForBilling();
        const results: ContractRevenueResult[] = [];
        let totalRevenue = 0;
        let totalPenalties = 0;

        for (const contract of contractsDueForBilling) {
            try {
                const result = await this.processContractRevenue(contract);
                results.push(result);
                totalRevenue += result.revenueApplied;
                totalPenalties += result.penaltiesApplied;
            } catch (error) {
                this.logger.error(`Error processing contract ${contract.id}: ${error.message}`);
            }
        }

        const netRevenue = totalRevenue - totalPenalties;
        
        return {
            totalRevenue,
            totalPenalties,
            netRevenue,
            contractsProcessed: results.length,
            results
        };
    }

    private async getActiveContracts(): Promise<Contract[]> {
        return await this.contractRepository.find({
            where: { status: ContractStatus.ACTIVE },
            relations: ['userId', 'serviceId']
        });
    }

    private async getContractsDueForBilling(): Promise<Contract[]> {
        const now = new Date();
        const currentDay = now.getDate();
        
        return await this.contractRepository.find({
            where: { 
                status: ContractStatus.ACTIVE
            },
            relations: ['userId', 'serviceId']
        }).then(contracts => 
            contracts.filter(contract => {
                const startDate = new Date(contract.startDate);
                return startDate.getDate() === currentDay;
            })
        );
    }

    private getSLAViolationType(slaStatus: any): string {
        const violations = [];
        if (!slaStatus.compliance.uptimeCompliant) violations.push('Uptime');
        if (!slaStatus.compliance.latencyCompliant) violations.push('Latency');
        if (!slaStatus.compliance.throughputCompliant) violations.push('Throughput');
        return violations.join(', ') + ' SLA Violation';
    }

    private calculatePenaltyRate(contract: Contract, penaltyAmount: number): number {
        return (penaltyAmount / contract.monthlyPrice) * 100;
    }

    private getCurrentBillingPeriodStart(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    private getCurrentBillingPeriodEnd(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    private async resetContractPeriodMetrics(contract: Contract): Promise<void> {
        contract.currentPeriodUptimePercent = 100;
        contract.currentPeriodAvgLatencyMs = 0;
        contract.currentPeriodAvgThroughputMbps = contract.guaranteedThroughputMbps;
        contract.currentPeriodIncidentCount = 0;
        contract.currentPeriodPenalties = 0;
        contract.updatedAt = new Date();
        
        await this.contractRepository.save(contract);
    }

    async processAllContractRevenue(): Promise<Array<{
        contractId: number;
        revenue: number;
        penalties: number;
        netAmount: number;
    }>> {
        const activeContracts = await this.getActiveContracts();
        const results = [];

        for (const contract of activeContracts) {
            try {
                const result = await this.processContractRevenue(contract);
                results.push({
                    contractId: contract.id,
                    revenue: result.revenueApplied,
                    penalties: result.penaltiesApplied,
                    netAmount: result.netRevenue
                });
            } catch (error) {
                this.logger.error(`Error processing revenue for contract ${contract.id}: ${error.message}`);
            }
        }

        return results;
    }

    async getRevenueStats(): Promise<any> {
        const activeContracts = await this.getActiveContracts();
        const totalMonthlyRevenue = activeContracts.reduce((sum, contract) => sum + contract.monthlyPrice, 0);
        
        const contractsWithPenalties = activeContracts.filter(contract => 
            (contract.currentPeriodPenalties || 0) > 0
        );
        
        const totalPendingPenalties = contractsWithPenalties.reduce((sum, contract) => 
            sum + (contract.currentPeriodPenalties || 0), 0
        );
        
        return {
            activeContracts: activeContracts.length,
            totalMonthlyRevenue,
            contractsWithPenalties: contractsWithPenalties.length,
            totalPendingPenalties,
            projectedNetRevenue: totalMonthlyRevenue - totalPendingPenalties
        };
    }
}