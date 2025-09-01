import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../Models/Entities/ContractEntity';
import { Service } from '../Models/Entities/ServiceEntity';
import { CreateContractRequest } from '../Models/Request/ContractController/CreateContractRequest';
import { UpdateContractRequest } from '../Models/Request/ContractController/UpdateContractRequest';
import { ContractStatus } from '../Enums/ServiceEnum';
import { ContractMetrics } from '../Models/Response/ContractController/GetContractMetricsResponse';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContractService {
    constructor(
        @InjectRepository(Contract)
        private readonly contractRepository: Repository<Contract>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>
    ) {}

    async createContract(request: CreateContractRequest): Promise<number> {
        const service = await this.serviceRepository.findOne({
            where: { id: request.serviceId }
        });

        if (!service) {
            throw new NotFoundException(`Service with ID ${request.serviceId} not found`);
        }

        if (!service.isAvailableForContracts) {
            throw new BadRequestException('Service is not available for contracts');
        }

        if (service.currentActiveContracts >= service.maxConcurrentContracts) {
            throw new BadRequestException('Service has reached maximum concurrent contracts');
        }

        const contract = new Contract();
        contract.uuid = uuidv4();
        contract.contractNumber = await this.generateContractNumber();
        contract.providerId = { id: request.providerId } as any;
        contract.clientId = { id: request.clientId } as any;
        contract.serviceId = { id: request.serviceId } as any;
        contract.description = request.description;
        contract.status = ContractStatus.DRAFT;
        contract.startDate = request.startDate;
        contract.endDate = request.endDate;
        contract.monthlyPrice = request.monthlyPrice;
        contract.setupFee = request.setupFee || 0;
        contract.securityDeposit = request.securityDeposit || 0;
        contract.billingDay = request.billingDay || 1;
        contract.autoPayment = request.autoPayment ?? true;
        contract.guaranteedUptimePercent = request.guaranteedUptimePercent;
        contract.maxLatencyMs = request.maxLatencyMs;
        contract.minThroughputMbps = request.minThroughputMbps;
        contract.maxIncidentResolutionHours = request.maxIncidentResolutionHours || 24;
        contract.slaPenalties = request.slaPenalties;
        contract.contractTerms = request.contractTerms;
        contract.createdAt = new Date();
        contract.updatedAt = new Date();

        const savedContract = await this.contractRepository.save(contract);
        return savedContract.id;
    }

    async getContractsByUser(userId: number): Promise<Contract[]> {
        return await this.contractRepository.find({
            where: [
                { providerId: { id: userId } },
                { clientId: { id: userId } }
            ],
            relations: ['providerId', 'clientId', 'serviceId']
        });
    }

    async getContractsByProvider(providerId: number): Promise<Contract[]> {
        return await this.contractRepository.find({
            where: { providerId: { id: providerId } },
            relations: ['providerId', 'clientId', 'serviceId']
        });
    }

    async getContractsByClient(clientId: number): Promise<Contract[]> {
        return await this.contractRepository.find({
            where: { clientId: { id: clientId } },
            relations: ['providerId', 'clientId', 'serviceId']
        });
    }

    async getContractById(id: number): Promise<Contract> {
        const contract = await this.contractRepository.findOne({
            where: { id },
            relations: ['providerId', 'clientId', 'serviceId']
        });

        if (!contract) {
            throw new NotFoundException(`Contract with ID ${id} not found`);
        }

        return contract;
    }

    async updateContract(id: number, request: UpdateContractRequest): Promise<void> {
        const contract = await this.getContractById(id);

        if (request.description !== undefined) contract.description = request.description;
        if (request.status !== undefined) contract.status = request.status;
        if (request.startDate !== undefined) contract.startDate = request.startDate;
        if (request.endDate !== undefined) contract.endDate = request.endDate;
        if (request.monthlyPrice !== undefined) contract.monthlyPrice = request.monthlyPrice;
        if (request.setupFee !== undefined) contract.setupFee = request.setupFee;
        if (request.securityDeposit !== undefined) contract.securityDeposit = request.securityDeposit;
        if (request.billingDay !== undefined) contract.billingDay = request.billingDay;
        if (request.autoPayment !== undefined) contract.autoPayment = request.autoPayment;
        if (request.guaranteedUptimePercent !== undefined) contract.guaranteedUptimePercent = request.guaranteedUptimePercent;
        if (request.maxLatencyMs !== undefined) contract.maxLatencyMs = request.maxLatencyMs;
        if (request.minThroughputMbps !== undefined) contract.minThroughputMbps = request.minThroughputMbps;
        if (request.maxIncidentResolutionHours !== undefined) contract.maxIncidentResolutionHours = request.maxIncidentResolutionHours;
        if (request.contractTerms !== undefined) contract.contractTerms = request.contractTerms;

        contract.updatedAt = new Date();
        await this.contractRepository.save(contract);
    }

    async deleteContract(id: number): Promise<void> {
        const contract = await this.getContractById(id);
        
        if (contract.status === ContractStatus.ACTIVE) {
            throw new BadRequestException('Cannot delete active contract. Terminate it first.');
        }

        await this.contractRepository.remove(contract);
    }

    async activateContract(id: number): Promise<void> {
        const contract = await this.getContractById(id);
        
        if (contract.status !== ContractStatus.PENDING) {
            throw new BadRequestException('Only pending contracts can be activated');
        }

        contract.status = ContractStatus.ACTIVE;
        contract.activationDate = new Date();
        contract.signedDate = new Date();
        contract.updatedAt = new Date();
        
        await this.contractRepository.save(contract);
        await this.incrementServiceActiveContracts(contract.serviceId.id);
    }

    async suspendContract(id: number): Promise<void> {
        const contract = await this.getContractById(id);
        contract.status = ContractStatus.SUSPENDED;
        contract.updatedAt = new Date();
        await this.contractRepository.save(contract);
    }

    async terminateContract(id: number): Promise<void> {
        const contract = await this.getContractById(id);
        contract.status = ContractStatus.TERMINATED;
        contract.terminationDate = new Date();
        contract.updatedAt = new Date();
        
        await this.contractRepository.save(contract);
        await this.decrementServiceActiveContracts(contract.serviceId.id);
    }

    async getContractMetrics(id: number): Promise<ContractMetrics> {
        const contract = await this.getContractById(id);
        
        const slaCompliance = {
            uptimeCompliant: contract.currentPeriodUptimePercent >= contract.guaranteedUptimePercent,
            latencyCompliant: contract.currentPeriodAvgLatencyMs <= contract.maxLatencyMs,
            throughputCompliant: contract.currentPeriodAvgThroughputMbps >= contract.minThroughputMbps
        };

        const totalRevenue = this.calculateTotalRevenue(contract);
        const penaltiesApplied = contract.currentPeriodPenalties || 0;
        const netRevenue = totalRevenue - penaltiesApplied;

        const nextBillingDate = this.calculateNextBillingDate(contract);
        const daysUntilExpiry = this.calculateDaysUntilExpiry(contract);

        return {
            contractId: contract.id,
            currentPeriodUptimePercent: contract.currentPeriodUptimePercent || 0,
            currentPeriodAvgLatencyMs: contract.currentPeriodAvgLatencyMs || 0,
            currentPeriodAvgThroughputMbps: contract.currentPeriodAvgThroughputMbps || 0,
            currentPeriodIncidentCount: contract.currentPeriodIncidentCount || 0,
            currentPeriodPenalties: penaltiesApplied,
            slaCompliance,
            revenue: {
                monthlyRevenue: contract.monthlyPrice,
                totalRevenue,
                penaltiesApplied,
                netRevenue
            },
            nextBillingDate,
            daysUntilExpiry
        };
    }

    async getSLAStatus(id: number): Promise<any> {
        const contract = await this.getContractById(id);
        
        return {
            contractId: contract.id,
            slaTargets: {
                uptimePercent: contract.guaranteedUptimePercent,
                maxLatencyMs: contract.maxLatencyMs,
                minThroughputMbps: contract.minThroughputMbps,
                maxIncidentResolutionHours: contract.maxIncidentResolutionHours
            },
            currentPerformance: {
                uptimePercent: contract.currentPeriodUptimePercent || 0,
                avgLatencyMs: contract.currentPeriodAvgLatencyMs || 0,
                avgThroughputMbps: contract.currentPeriodAvgThroughputMbps || 0,
                incidentCount: contract.currentPeriodIncidentCount || 0
            },
            compliance: {
                uptimeCompliant: (contract.currentPeriodUptimePercent || 0) >= contract.guaranteedUptimePercent,
                latencyCompliant: (contract.currentPeriodAvgLatencyMs || 0) <= contract.maxLatencyMs,
                throughputCompliant: (contract.currentPeriodAvgThroughputMbps || 0) >= contract.minThroughputMbps
            },
            penalties: contract.slaPenalties
        };
    }

    async applyPenalties(id: number): Promise<void> {
        const contract = await this.getContractById(id);
        const slaStatus = await this.getSLAStatus(id);
        
        let totalPenalties = 0;
        
        if (!slaStatus.compliance.uptimeCompliant && contract.slaPenalties?.uptimePenalty) {
            const penalty = contract.monthlyPrice * (contract.slaPenalties.uptimePenalty.penaltyPercentage / 100);
            totalPenalties += penalty;
        }
        
        if (!slaStatus.compliance.latencyCompliant && contract.slaPenalties?.latencyPenalty) {
            const penalty = contract.monthlyPrice * (contract.slaPenalties.latencyPenalty.penaltyPercentage / 100);
            totalPenalties += penalty;
        }
        
        if (!slaStatus.compliance.throughputCompliant && contract.slaPenalties?.throughputPenalty) {
            const penalty = contract.monthlyPrice * (contract.slaPenalties.throughputPenalty.penaltyPercentage / 100);
            totalPenalties += penalty;
        }
        
        contract.currentPeriodPenalties = (contract.currentPeriodPenalties || 0) + totalPenalties;
        contract.updatedAt = new Date();
        
        await this.contractRepository.save(contract);
    }

    private async generateContractNumber(): Promise<string> {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `CNT-${timestamp}-${random}`;
    }

    private async incrementServiceActiveContracts(serviceId: number): Promise<void> {
        const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
        if (service) {
            service.currentActiveContracts += 1;
            await this.serviceRepository.save(service);
        }
    }

    private async decrementServiceActiveContracts(serviceId: number): Promise<void> {
        const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
        if (service && service.currentActiveContracts > 0) {
            service.currentActiveContracts -= 1;
            await this.serviceRepository.save(service);
        }
    }

    private calculateTotalRevenue(contract: Contract): number {
        if (!contract.activationDate) return 0;
        
        const now = new Date();
        const monthsActive = Math.floor((now.getTime() - contract.activationDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        return (contract.setupFee || 0) + (contract.monthlyPrice * monthsActive);
    }

    private calculateNextBillingDate(contract: Contract): Date {
        const now = new Date();
        const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, contract.billingDay);
        return nextBilling;
    }

    private calculateDaysUntilExpiry(contract: Contract): number {
        if (!contract.endDate) return -1;
        
        const now = new Date();
        const diffTime = contract.endDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    async getContractStats(): Promise<{
        totalContracts: number;
        activeContracts: number;
        monthlyRevenue: number;
        totalPenalties: number;
        averageUptime: number;
    }> {
        const allContracts = await this.contractRepository.find();
        const activeContracts = allContracts.filter(c => c.status === ContractStatus.ACTIVE);
        
        const totalContracts = allContracts.length;
        const activeContractsCount = activeContracts.length;
        
        const monthlyRevenue = activeContracts.reduce((sum, contract) => {
            return sum + (contract.monthlyPrice || 0);
        }, 0);
        
        const totalPenalties = allContracts.reduce((sum, contract) => {
            return sum + (contract.currentPeriodPenalties || 0);
        }, 0);
        
        const averageUptime = activeContracts.length > 0 
            ? activeContracts.reduce((sum, contract) => {
                return sum + (contract.currentPeriodUptimePercent || 100);
            }, 0) / activeContracts.length
            : 100;
        
        return {
            totalContracts,
            activeContracts: activeContractsCount,
            monthlyRevenue,
            totalPenalties,
            averageUptime
        };
    }
}