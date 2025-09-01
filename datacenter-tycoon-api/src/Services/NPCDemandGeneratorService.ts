import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NPC } from '../Models/Entities/NPCEntity';
import { Service } from '../Models/Entities/ServiceEntity';
import { NPCTier, NPCStatus, NPCDemandFrequency, NPCBehaviorType } from '../Enums/NPCEnum';
import { ServiceType, ServiceStatus } from '../Enums/ServiceEnum';

import { EventEmitter2 } from '@nestjs/event-emitter';


interface DemandGenerationResult {
    npcId: number;
    serviceType: ServiceType;
    demandGenerated: boolean;
    reason?: string;
}

interface ServiceDemandConfig {
    [NPCTier.STARTUP]: {
        [key in ServiceType]?: {
            baseChance: number;
            budgetMultiplier: number;
            slaRequirement: number;
            maxLatency: number;
        };
    };
    [NPCTier.SME]: {
        [key in ServiceType]?: {
            baseChance: number;
            budgetMultiplier: number;
            slaRequirement: number;
            maxLatency: number;
        };
    };
    [NPCTier.ENTERPRISE]: {
        [key in ServiceType]?: {
            baseChance: number;
            budgetMultiplier: number;
            slaRequirement: number;
            maxLatency: number;
        };
    };
    [NPCTier.GOVERNMENT]: {
        [key in ServiceType]?: {
            baseChance: number;
            budgetMultiplier: number;
            slaRequirement: number;
            maxLatency: number;
        };
    };
}

@Injectable()
export class NPCDemandGeneratorService {
    private readonly serviceDemandConfig: ServiceDemandConfig = {
        [NPCTier.STARTUP]: {
            [ServiceType.WEB_HOSTING]: {
                baseChance: 0.15,
                budgetMultiplier: 0.8,
                slaRequirement: 95.0,
                maxLatency: 200
            },
            [ServiceType.DATABASE_MANAGED]: {
                baseChance: 0.10,
                budgetMultiplier: 0.9,
                slaRequirement: 97.0,
                maxLatency: 100
            },
            [ServiceType.CDN]: {
                baseChance: 0.05,
                budgetMultiplier: 0.7,
                slaRequirement: 98.0,
                maxLatency: 50
            }
        },
        [NPCTier.SME]: {
            [ServiceType.WEB_HOSTING]: {
                baseChance: 0.20,
                budgetMultiplier: 1.0,
                slaRequirement: 97.0,
                maxLatency: 150
            },
            [ServiceType.DATABASE_MANAGED]: {
                baseChance: 0.18,
                budgetMultiplier: 1.1,
                slaRequirement: 98.0,
                maxLatency: 150
            },
            [ServiceType.COLOCATION]: {
                baseChance: 0.12,
                budgetMultiplier: 1.2,
                slaRequirement: 98.5,
                maxLatency: 60
            },
            [ServiceType.CDN]: {
                baseChance: 0.08,
                budgetMultiplier: 0.9,
                slaRequirement: 98.5,
                maxLatency: 40
            }
        },
        [NPCTier.ENTERPRISE]: {
            [ServiceType.WEB_HOSTING]: {
                baseChance: 0.25,
                budgetMultiplier: 1.3,
                slaRequirement: 98.5,
                maxLatency: 100
            },
            [ServiceType.DATABASE_MANAGED]: {
                baseChance: 0.22,
                budgetMultiplier: 1.4,
                slaRequirement: 99.0,
                maxLatency: 100
            },
            [ServiceType.COLOCATION]: {
                baseChance: 0.20,
                budgetMultiplier: 1.5,
                slaRequirement: 99.0,
                maxLatency: 40
            },
            [ServiceType.CDN]: {
                baseChance: 0.15,
                budgetMultiplier: 1.2,
                slaRequirement: 99.0,
                maxLatency: 30
            }
        },
        [NPCTier.GOVERNMENT]: {
            [ServiceType.WEB_HOSTING]: {
                baseChance: 0.30,
                budgetMultiplier: 1.8,
                slaRequirement: 99.5,
                maxLatency: 80
            },
            [ServiceType.DATABASE_MANAGED]: {
                baseChance: 0.28,
                budgetMultiplier: 2.0,
                slaRequirement: 99.8,
                maxLatency: 80
            },
            [ServiceType.COLOCATION]: {
                baseChance: 0.25,
                budgetMultiplier: 2.2,
                slaRequirement: 99.9,
                maxLatency: 20
            },
            [ServiceType.CDN]: {
                baseChance: 0.20,
                budgetMultiplier: 1.8,
                slaRequirement: 99.5,
                maxLatency: 25
            }
        }
    };

    constructor(
        @InjectRepository(NPC)
        private readonly npcRepository: Repository<NPC>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        private readonly eventEmitter: EventEmitter2
    ) {}

    async generateDemandForAllNPCs(): Promise<DemandGenerationResult[]> {
        const activeNPCs = await this.npcRepository.find({
            where: { status: NPCStatus.ACTIVE }
        });

        const results: DemandGenerationResult[] = [];

        for (const npc of activeNPCs) {
            const npcResults = await this.generateDemandForNPC(npc);
            results.push(...npcResults);
        }

        return results;
    }

    async generateDemandForNPC(npc: NPC): Promise<DemandGenerationResult[]> {
        const results: DemandGenerationResult[] = [];

        if (!this.shouldGenerateDemand(npc)) {
            results.push({
                npcId: npc.id,
                serviceType: ServiceType.WEB_HOSTING,
                demandGenerated: false,
                reason: 'NPC not ready for demand generation'
            });
            return results;
        }

        const serviceTypes = this.getRelevantServiceTypes(npc.tier);

        for (const serviceType of serviceTypes) {
            const demandResult = await this.evaluateServiceDemand(npc, serviceType);
            results.push(demandResult);

            if (demandResult.demandGenerated) {
                await this.createContractRequest(npc, serviceType);
            }
        }

        npc.lastDemandGeneration = new Date();
        npc.nextDemandEvaluation = this.calculateNextEvaluation(npc);
        await this.npcRepository.save(npc);

        return results;
    }

    private shouldGenerateDemand(npc: NPC): boolean {
        if (npc.status !== NPCStatus.ACTIVE) {
            return false;
        }

        if (npc.nextDemandEvaluation && npc.nextDemandEvaluation > new Date()) {
            return false;
        }

        const maxContracts = this.getMaxContractsForTier(npc.tier);
        if (npc.activeContracts >= maxContracts) {
            return false;
        }

        return true;
    }

    private async evaluateServiceDemand(npc: NPC, serviceType: ServiceType): Promise<DemandGenerationResult> {
        const config = this.serviceDemandConfig[npc.tier]?.[serviceType];
        if (!config) {
            return {
                npcId: npc.id,
                serviceType,
                demandGenerated: false,
                reason: 'Service type not supported for this tier'
            };
        }

        const baseChance = config.baseChance;
        const adjustedChance = this.adjustChanceByBehavior(baseChance, npc.behaviorType, npc.demandFrequency);
        const finalChance = this.applySeasonalMultipliers(adjustedChance, npc);

        const randomValue = Math.random();
        const demandGenerated = randomValue < finalChance;

        if (demandGenerated) {
            const availableServices = await this.findSuitableServices(npc, serviceType, config);
            if (availableServices.length === 0) {
                return {
                    npcId: npc.id,
                    serviceType,
                    demandGenerated: false,
                    reason: 'No suitable services available'
                };
            }
        }

        return {
            npcId: npc.id,
            serviceType,
            demandGenerated,
            reason: demandGenerated ? 'Demand generated successfully' : 'Random chance did not trigger demand'
        };
    }

    private adjustChanceByBehavior(baseChance: number, behavior: NPCBehaviorType, frequency: NPCDemandFrequency): number {
        let multiplier = 1.0;

        switch (behavior) {
            case NPCBehaviorType.AGGRESSIVE:
                multiplier *= 1.5;
                break;
            case NPCBehaviorType.CONSERVATIVE:
                multiplier *= 0.7;
                break;
            case NPCBehaviorType.PRICE_SENSITIVE:
                multiplier *= 0.9;
                break;
            case NPCBehaviorType.QUALITY_FOCUSED:
                multiplier *= 1.2;
                break;
            default:
                multiplier *= 1.0;
        }

        switch (frequency) {
            case NPCDemandFrequency.VERY_HIGH:
                multiplier *= 1.8;
                break;
            case NPCDemandFrequency.HIGH:
                multiplier *= 1.4;
                break;
            case NPCDemandFrequency.MEDIUM:
                multiplier *= 1.0;
                break;
            case NPCDemandFrequency.LOW:
                multiplier *= 0.6;
                break;
        }

        return Math.min(baseChance * multiplier, 0.95);
    }

    private applySeasonalMultipliers(chance: number, npc: NPC): number {
        if (!npc.demandConfig?.seasonalMultipliers) {
            return chance;
        }

        const currentMonth = new Date().getMonth().toString();
        const seasonalMultiplier = npc.demandConfig.seasonalMultipliers[currentMonth] || 1.0;

        const currentHour = new Date().getHours().toString();
        const timeMultiplier = npc.demandConfig.timeOfDayMultipliers?.[currentHour] || 1.0;

        return Math.min(chance * seasonalMultiplier * timeMultiplier, 0.98);
    }

    private async findSuitableServices(npc: NPC, serviceType: ServiceType, config: any): Promise<Service[]> {
        const services = await this.serviceRepository.find({
            where: {
                serviceTypeId: { type: serviceType },
                status: ServiceStatus.ACTIVE
            },
            relations: ['userId', 'serviceTypeId']
        });

        return services.filter(service => {
            if (npc.isProviderBlacklisted(service.userId.uuid)) {
                return false;
            }

            if (!npc.canAffordContract(service.monthlyPrice)) {
                return false;
            }

            if (!npc.meetsMinimumRequirements(
                service.guaranteedUptimePercent,
                service.maxLatencyMs,
                service.userId.averageUptime || 0
            )) {
                return false;
            }

            return true;
        });
    }

    private async createContractRequest(npc: NPC, serviceType: ServiceType): Promise<void> {
        const config = this.serviceDemandConfig[npc.tier][serviceType];
        const suitableServices = await this.findSuitableServices(npc, serviceType, config);

        if (suitableServices.length === 0) {
            return;
        }

        const selectedService = this.selectBestService(npc, suitableServices);
        const contractDuration = this.generateContractDuration(npc);

        this.eventEmitter.emit('npc.contract.requested', {
            npcId: npc.id,
            npcUuid: npc.uuid,
            npcName: npc.name,
            npcTier: npc.tier,
            serviceId: selectedService.id,
            serviceUuid: selectedService.uuid,
            providerId: selectedService.userId.id,
            providerUuid: selectedService.userId.uuid,
            serviceType: serviceType,
            monthlyPrice: selectedService.monthlyPrice,
            contractDuration: contractDuration,
            requestedAt: new Date()
        });
    }

    private selectBestService(npc: NPC, services: Service[]): Service {
        const weights = npc.evaluationWeights || {
            price: 0.3,
            reputation: 0.25,
            slaCompliance: 0.25,
            latency: 0.15,
            features: 0.05
        };

        let bestService = services[0];
        let bestScore = 0;

        for (const service of services) {
            const score = this.calculateServiceScore(service, weights, npc);
            if (score > bestScore) {
                bestScore = score;
                bestService = service;
            }
        }

        return bestService;
    }

    private calculateServiceScore(service: Service, weights: any, npc: NPC): number {
        const maxPrice = npc.monthlyBudget;
        const priceScore = Math.max(0, (maxPrice - service.monthlyPrice) / maxPrice);
        const reputationScore = (service.userId.averageUptime || 0) / 100;
        const slaScore = service.guaranteedUptimePercent / 100;
        const latencyScore = Math.max(0, (npc.maxLatencyMs - service.maxLatencyMs) / npc.maxLatencyMs);
        const featuresScore = 0.8;

        return (
            priceScore * weights.price +
            reputationScore * weights.reputation +
            slaScore * weights.slaCompliance +
            latencyScore * weights.latency +
            featuresScore * weights.features
        );
    }

    private generateContractDuration(npc: NPC): number {
        const preferences = npc.demandConfig?.contractDurationPreference;
        if (!preferences) {
            return this.getDefaultContractDuration(npc.getTier());
        }

        const min = preferences.min || 1;
        const max = preferences.max || 12;
        const preferred = preferences.preferred || 6;

        const random = Math.random();
        if (random < 0.6) {
            return preferred;
        } else if (random < 0.8) {
            return Math.floor(Math.random() * (preferred - min + 1)) + min;
        } else {
            return Math.floor(Math.random() * (max - preferred + 1)) + preferred;
        }
    }

    private getDefaultContractDuration(tier: NPCTier): number {
        switch (tier) {
            case NPCTier.STARTUP:
                return 3;
            case NPCTier.SME:
                return 6;
            case NPCTier.ENTERPRISE:
                return 12;
            case NPCTier.GOVERNMENT:
                return 24;
            default:
                return 6;
        }
    }

    private getRelevantServiceTypes(tier: NPCTier): ServiceType[] {
        const config = this.serviceDemandConfig[tier];
        return Object.keys(config) as ServiceType[];
    }

    private getMaxContractsForTier(tier: NPCTier): number {
        switch (tier) {
            case NPCTier.STARTUP:
                return 2;
            case NPCTier.SME:
                return 5;
            case NPCTier.ENTERPRISE:
                return 10;
            case NPCTier.GOVERNMENT:
                return 15;
            default:
                return 3;
        }
    }

    private calculateNextEvaluation(npc: NPC): Date {
        const baseInterval = this.getBaseIntervalForFrequency(npc.demandFrequency);
        const randomVariation = Math.random() * 0.4 + 0.8;
        const finalInterval = baseInterval * randomVariation;

        const nextEvaluation = new Date();
        nextEvaluation.setMinutes(nextEvaluation.getMinutes() + finalInterval);
        return nextEvaluation;
    }

    private getBaseIntervalForFrequency(frequency: NPCDemandFrequency): number {
        switch (frequency) {
            case NPCDemandFrequency.VERY_HIGH:
                return 30;
            case NPCDemandFrequency.HIGH:
                return 60;
            case NPCDemandFrequency.MEDIUM:
                return 120;
            case NPCDemandFrequency.LOW:
                return 240;
            default:
                return 120;
        }
    }
}