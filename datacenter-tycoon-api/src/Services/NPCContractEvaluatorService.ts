import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NPC } from '../Models/Entities/NPCEntity';
import { Service } from '../Models/Entities/ServiceEntity';
import { Contract } from '../Models/Entities/ContractEntity';
import { NPCTier, NPCBehaviorType, NPCRiskTolerance } from '../Enums/NPCEnum';
import { ContractStatus } from '../Enums/ServiceEnum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletService } from './WalletService';
import { v4 as uuidv4 } from 'uuid';

interface ContractEvaluationResult {
    accepted: boolean;
    score: number;
    reason: string;
    counterOffer?: {
        monthlyPrice: number;
        contractDuration: number;
        slaRequirement: number;
    };
}

interface ServiceEvaluation {
    serviceId: number;
    providerId: number;
    priceScore: number;
    reputationScore: number;
    slaScore: number;
    latencyScore: number;
    reliabilityScore: number;
    totalScore: number;
    acceptable: boolean;
    reasons: string[];
}

@Injectable()
export class NPCContractEvaluatorService {
    private readonly acceptanceThresholds = {
        [NPCTier.STARTUP]: {
            minScore: 0.6,
            priceWeight: 0.4,
            reputationWeight: 0.2,
            slaWeight: 0.2,
            latencyWeight: 0.15,
            reliabilityWeight: 0.05
        },
        [NPCTier.SME]: {
            minScore: 0.65,
            priceWeight: 0.3,
            reputationWeight: 0.25,
            slaWeight: 0.25,
            latencyWeight: 0.15,
            reliabilityWeight: 0.05
        },
        [NPCTier.ENTERPRISE]: {
            minScore: 0.7,
            priceWeight: 0.2,
            reputationWeight: 0.3,
            slaWeight: 0.3,
            latencyWeight: 0.15,
            reliabilityWeight: 0.05
        },
        [NPCTier.GOVERNMENT]: {
            minScore: 0.8,
            priceWeight: 0.15,
            reputationWeight: 0.25,
            slaWeight: 0.35,
            latencyWeight: 0.15,
            reliabilityWeight: 0.1
        }
    };

    constructor(
        @InjectRepository(NPC)
        private readonly npcRepository: Repository<NPC>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(Contract)
        private readonly contractRepository: Repository<Contract>,
        private readonly walletService: WalletService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    async evaluateServiceOffer(
        npcId: number,
        serviceId: number,
        proposedPrice?: number,
        proposedDuration?: number
    ): Promise<ContractEvaluationResult> {
        const npc = await this.npcRepository.findOne({ where: { id: npcId } });
        if (!npc) {
            throw new Error(`NPC with ID ${npcId} not found`);
        }

        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
            relations: ['userId']
        });
        if (!service) {
            throw new Error(`Service with ID ${serviceId} not found`);
        }

        if (npc.isProviderBlacklisted(service.userId.uuid)) {
            return {
                accepted: false,
                score: 0,
                reason: 'Provider is blacklisted due to previous poor performance'
            };
        }

        const evaluation = this.evaluateService(npc, service, proposedPrice, proposedDuration);
        
        if (evaluation.acceptable) {
            const contract = await this.createContract(npc, service, proposedPrice, proposedDuration);
            await this.processContractPayment(npc, contract);
            
            this.eventEmitter.emit('npc.contract.accepted', {
                npcId: npc.id,
                npcUuid: npc.uuid,
                contractId: contract.id,
                contractUuid: contract.uuid,
                serviceId: service.id,
                providerId: service.userId.id,
                monthlyPrice: contract.monthlyPrice,
                acceptedAt: new Date()
            });

            return {
                accepted: true,
                score: evaluation.totalScore,
                reason: `Contract accepted with score ${evaluation.totalScore.toFixed(2)}`
            };
        }

        const counterOffer = this.generateCounterOffer(npc, service, evaluation);
        if (counterOffer) {
            this.eventEmitter.emit('npc.contract.counter_offer', {
                npcId: npc.id,
                npcUuid: npc.uuid,
                serviceId: service.id,
                providerId: service.userId.id,
                originalPrice: proposedPrice || service.monthlyPrice,
                counterOffer: counterOffer,
                reasons: evaluation.reasons,
                offeredAt: new Date()
            });

            return {
                accepted: false,
                score: evaluation.totalScore,
                reason: `Counter offer proposed: ${evaluation.reasons.join(', ')}`,
                counterOffer: counterOffer
            };
        }

        this.eventEmitter.emit('npc.contract.rejected', {
             npcId: npc.id,
            npcUuid: npc.uuid,
            serviceId: service.id,
            providerId: service.userId.id,
            reasons: evaluation.reasons,
            score: evaluation.totalScore,
            rejectedAt: new Date()
        });

        return {
            accepted: false,
            score: evaluation.totalScore,
            reason: `Contract rejected: ${evaluation.reasons.join(', ')}`
        };
    }

    private evaluateService(
        npc: NPC,
        service: Service,
        proposedPrice?: number,
        proposedDuration?: number
    ): ServiceEvaluation {
        const thresholds = this.acceptanceThresholds[npc.getTier()];
        const effectivePrice = proposedPrice || service.monthlyPrice;
        const reasons: string[] = [];

        const priceScore = this.calculatePriceScore(npc, effectivePrice, reasons);
        const reputationScore = this.calculateReputationScore(npc, service, reasons);
        const slaScore = this.calculateSLAScore(npc, service, reasons);
        const latencyScore = this.calculateLatencyScore(npc, service, reasons);
        const reliabilityScore = this.calculateReliabilityScore(npc, service, reasons);

        const behaviorAdjustment = this.getBehaviorAdjustment(npc.getBehaviorType());
        const riskAdjustment = this.getRiskAdjustment(npc.riskTolerance);

        const totalScore = (
            priceScore * thresholds.priceWeight +
            reputationScore * thresholds.reputationWeight +
            slaScore * thresholds.slaWeight +
            latencyScore * thresholds.latencyWeight +
            reliabilityScore * thresholds.reliabilityWeight
        ) * behaviorAdjustment * riskAdjustment;

        const acceptable = totalScore >= thresholds.minScore && reasons.length === 0;

        return {
            serviceId: service.id,
            providerId: service.userId.id,
            priceScore,
            reputationScore,
            slaScore,
            latencyScore,
            reliabilityScore,
            totalScore,
            acceptable,
            reasons
        };
    }

    private calculatePriceScore(npc: NPC, price: number, reasons: string[]): number {
        if (!npc.canAffordContract(price)) {
            reasons.push(`Price ${price} exceeds budget constraints`);
            return 0;
        }

        const budgetUtilization = price / npc.getMonthlyBudget();
        
        if (budgetUtilization > 0.8) {
            reasons.push('Price consumes too much of monthly budget');
            return 0.3;
        }
        
        if (budgetUtilization > 0.6) {
            return 0.6;
        }
        
        if (budgetUtilization > 0.4) {
            return 0.8;
        }
        
        return 1.0;
    }

    private calculateReputationScore(npc: NPC, service: Service, reasons: string[]): number {
        const providerReputation = service.userId.reputationScore;
        const npcHistory = npc.getProviderRating(service.userId.uuid);
        
        if (providerReputation < npc.minReputationScore) {
            reasons.push(`Provider reputation ${providerReputation} below minimum ${npc.minReputationScore}`);
            return 0;
        }

        let score = providerReputation / 100;
        
        if (npcHistory > 0) {
            score = (score + npcHistory / 5) / 2;
        }

        return Math.min(score, 1.0);
    }

    private calculateSLAScore(npc: NPC, service: Service, reasons: string[]): number {
        if (service.guaranteedUptimePercent < npc.minUptimeSLA) {
            reasons.push(`SLA ${service.guaranteedUptimePercent}% below minimum ${npc.minUptimeSLA}%`);
            return 0;
        }

        const slaBuffer = service.guaranteedUptimePercent - npc.minUptimeSLA;
        return Math.min(slaBuffer / 5 + 0.5, 1.0);
    }

    private calculateLatencyScore(npc: NPC, service: Service, reasons: string[]): number {
        if (service.maxLatencyMs > npc.maxLatencyMs) {
            reasons.push(`Latency ${service.maxLatencyMs}ms exceeds maximum ${npc.maxLatencyMs}ms`);
            return 0;
        }

        const latencyRatio = service.maxLatencyMs / npc.maxLatencyMs;
        return 1 - latencyRatio;
    }

    private calculateReliabilityScore(npc: NPC, service: Service, reasons: string[]): number {
        const providerHistory = npc.providerHistory?.[service.userId.uuid];
        
        if (!providerHistory) {
            return 0.7;
        }

        const slaBreachRate = providerHistory.slaBreaches / Math.max(providerHistory.contractsCount, 1);
        
        if (slaBreachRate > 0.3) {
            reasons.push('Provider has high SLA breach rate');
            return 0.2;
        }
        
        if (slaBreachRate > 0.1) {
            return 0.6;
        }
        
        return 1.0;
    }

    private getBehaviorAdjustment(behavior: NPCBehaviorType): number {
        switch (behavior) {
            case NPCBehaviorType.CONSERVATIVE:
                return 0.8;
            case NPCBehaviorType.AGGRESSIVE:
                return 1.3;
            case NPCBehaviorType.PRICE_SENSITIVE:
                return 0.9;
            case NPCBehaviorType.QUALITY_FOCUSED:
                return 1.1;
            default:
                return 1.0;
        }
    }

    private getRiskAdjustment(riskTolerance: NPCRiskTolerance): number {
        switch (riskTolerance) {
            case NPCRiskTolerance.VERY_LOW:
                return 0.7;
            case NPCRiskTolerance.LOW:
                return 0.85;
            case NPCRiskTolerance.MEDIUM:
                return 1.0;
            case NPCRiskTolerance.HIGH:
                return 1.15;
            case NPCRiskTolerance.VERY_HIGH:
                return 1.3;
            default:
                return 1.0;
        }
    }

    private generateCounterOffer(
        npc: NPC,
        service: Service,
        evaluation: ServiceEvaluation
    ): { monthlyPrice: number; contractDuration: number; slaRequirement: number } | null {
        if (npc.getBehaviorType() === NPCBehaviorType.CONSERVATIVE) {
            return null;
        }

        if (evaluation.totalScore < 0.4) {
            return null;
        }

        const currentPrice = service.monthlyPrice;
        const maxAffordable = Math.min(npc.maxContractBudget, npc.getMonthlyBudget() * 0.6);
        
        if (currentPrice > maxAffordable) {
            const counterPrice = maxAffordable * 0.9;
            const longerDuration = Math.min(24, service.contractDuration * 1.5);
            
            return {
                monthlyPrice: Math.round(counterPrice * 100) / 100,
                contractDuration: longerDuration,
                slaRequirement: Math.max(npc.minUptimeSLA, service.guaranteedUptimePercent - 1)
            };
        }

        if (evaluation.priceScore < 0.7 && npc.getBehaviorType() === NPCBehaviorType.PRICE_SENSITIVE) {
            return {
                monthlyPrice: Math.round(currentPrice * 0.85 * 100) / 100,
                contractDuration: service.contractDuration,
                slaRequirement: service.guaranteedUptimePercent
            };
        }

        return null;
    }

    private async createContract(
        npc: NPC,
        service: Service,
        proposedPrice?: number,
        proposedDuration?: number
    ): Promise<Contract> {
        const contract = new Contract();
        contract.uuid = uuidv4();
        contract.setClientId(null);
        contract.serviceId = service;
        contract.providerId = service.userId;
        contract.isNPCContract = true;
        contract.setNpcId(npc.getId());
        contract.monthlyPrice = proposedPrice || service.monthlyPrice;
        contract.contractDuration = proposedDuration || service.contractDuration;
        contract.uptimeSLA = service.guaranteedUptimePercent;
        contract.penaltyPerHour = service.penaltyPerHour;
        contract.status = ContractStatus.ACTIVE;
        contract.startDate = new Date();
        
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + contract.contractDuration);
        contract.endDate = endDate;
        
        contract.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        contract.isNPCContract = true;

        const savedContract = await this.contractRepository.save(contract);
        
        npc.activeContracts = (npc.activeContracts || 0) + 1;
        npc.totalSpent = (npc.totalSpent || 0) + contract.monthlyPrice;
        await this.npcRepository.save(npc);

        return savedContract;
    }

    private async processContractPayment(npc: NPC, contract: Contract): Promise<void> {
        try {
            await this.walletService.processNPCPayment(
                npc.id,
                contract.providerId.id,
                contract.monthlyPrice,
                contract.id,
                `Contract payment for service ${contract.serviceId.id}`
            );
        } catch (error) {
            contract.status = ContractStatus.CANCELLED;
            await this.contractRepository.save(contract);
            
            npc.activeContracts = Math.max(0, (npc.activeContracts || 0) - 1);
            await this.npcRepository.save(npc);
            
            throw new Error(`Failed to process contract payment: ${error.message}`);
        }
    }

    async evaluateContractRenewal(contractId: number): Promise<ContractEvaluationResult> {
        const contract = await this.contractRepository.findOne({
            where: { id: contractId },
            relations: ['service', 'service.userId']
        });

        if (!contract || !contract.isNPCContract) {
            throw new Error('Contract not found or not an NPC contract');
        }

        const npc = await this.npcRepository.findOne({
            where: { id: contract.getNpcId() }
        });

        if (!npc) {
            throw new Error('NPC not found for contract renewal');
        }

        const renewalScore = this.calculateRenewalScore(npc, contract);
        const shouldRenew = renewalScore > 0.6;

        if (shouldRenew) {
            contract.endDate = new Date(Date.now() + contract.contractDuration * 30 * 24 * 60 * 60 * 1000);
            await this.contractRepository.save(contract);

            this.eventEmitter.emit('npc.contract.renewed', {
                npcId: npc.id,
                contractId: contract.id,
                renewalScore,
                renewedAt: new Date()
            });

            return {
                accepted: true,
                score: renewalScore,
                reason: 'Contract renewed based on performance'
            };
        }

        contract.status = ContractStatus.EXPIRED;
        await this.contractRepository.save(contract);
        
        npc.activeContracts = Math.max(0, (npc.activeContracts || 0) - 1);
        await this.npcRepository.save(npc);

        this.eventEmitter.emit('npc.contract.not_renewed', {
            npcId: npc.id,
            contractId: contract.getId(),
            renewalScore,
            expiredAt: new Date()
        });

        return {
            accepted: false,
            score: renewalScore,
            reason: 'Contract not renewed due to poor performance'
        };
    }

    private calculateRenewalScore(npc: NPC, contract: Contract): number {
        let score = 0.5;
        
        const providerHistory = npc.providerHistory?.[contract.serviceId.userId.uuid];
        if (providerHistory) {
            score += (providerHistory.rating / 5) * 0.3;
            
            const slaBreachRate = providerHistory.slaBreaches / Math.max(providerHistory.contractsCount, 1);
            score -= slaBreachRate * 0.4;
        }
        
        const currentReputation = contract.serviceId.userId.reputationScore;
        score += (currentReputation / 100) * 0.2;
        
        return Math.max(0, Math.min(1, score));
    }

    async cancelContract(contractId: number, reason: string): Promise<void> {
        const contract = await this.contractRepository.findOne({
            where: { id: contractId }
        });

        if (!contract || !contract.isNPCContract) {
            throw new Error('Contract not found or not an NPC contract');
        }

        const npc = await this.npcRepository.findOne({
            where: { id: contract.getNpcId() }
        });

        if (npc) {
            npc.decrementActiveContracts();
            npc.updateProviderRating(contract.serviceId?.userId?.uuid || '', 1, true);
            await this.npcRepository.save(npc);
        }

        contract.status = ContractStatus.CANCELLED;
        await this.contractRepository.save(contract);

        this.eventEmitter.emit('npc.contract.cancelled', {
            npcId: npc?.id,
            contractId: contract.id,
            reason,
            cancelledAt: new Date()
        });
    }
}