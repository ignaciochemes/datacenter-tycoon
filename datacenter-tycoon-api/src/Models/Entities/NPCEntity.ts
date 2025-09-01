import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { GenericEntity } from "./GenericTable";
import { NPCTier, NPCStatus, NPCBehaviorType, NPCDemandFrequency, NPCRiskTolerance } from "../../Enums/NPCEnum";
import { ServiceType } from "../../Enums/ServiceEnum";

@Entity()
export class NPC extends GenericEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ nullable: false })
    public uuid: string;

    @Column({ nullable: false, length: 255 })
    public name: string;

    @Column({ nullable: true, length: 1000 })
    public description: string;

    @Column({ type: 'enum', enum: NPCTier, nullable: false })
    public tier: NPCTier;

    @Column({ type: 'enum', enum: NPCStatus, default: NPCStatus.ACTIVE })
    public status: NPCStatus;

    @Column({ type: 'enum', enum: NPCBehaviorType, default: NPCBehaviorType.BALANCED })
    public behaviorType: NPCBehaviorType;

    @Column({ type: 'enum', enum: NPCDemandFrequency, default: NPCDemandFrequency.MEDIUM })
    public demandFrequency: NPCDemandFrequency;

    @Column({ type: 'enum', enum: NPCRiskTolerance, default: NPCRiskTolerance.MEDIUM })
    public riskTolerance: NPCRiskTolerance;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, comment: 'Monthly budget for services' })
    public monthlyBudget: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false, comment: 'Maximum budget for a single contract' })
    public maxContractBudget: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, comment: 'Minimum uptime SLA required (%)' })
    public minUptimeSLA: number;

    @Column({ nullable: false, comment: 'Maximum acceptable latency (ms)' })
    public maxLatencyMs: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false, comment: 'Minimum reputation score required (0-100)' })
    public minReputationScore: number;

    @Column({ type: 'json', nullable: true, comment: 'Preferred service types' })
    public preferredServices: ServiceType[];

    @Column({ type: 'json', nullable: true, comment: 'Service requirements and preferences' })
    public servicePreferences: {
        webHosting?: {
            minBandwidth?: number;
            sslRequired?: boolean;
            backupRequired?: boolean;
        };
        database?: {
            minStorage?: number;
            backupFrequency?: string;
            replicationRequired?: boolean;
        };
        colocation?: {
            minRackUnits?: number;
            powerRedundancy?: string;
            networkRedundancy?: string;
        };
        cdn?: {
            minLocations?: number;
            minBandwidth?: number;
        };
    };

    @Column({ type: 'json', nullable: true, comment: 'Contract evaluation weights' })
    public evaluationWeights: {
        price?: number;
        reputation?: number;
        slaCompliance?: number;
        latency?: number;
        features?: number;
    };

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, comment: 'Current reputation score (0-100)' })
    public currentReputationScore: number;

    @Column({ nullable: false, default: 0, comment: 'Number of active contracts' })
    public activeContracts: number;

    @Column({ nullable: false, default: 0, comment: 'Total contracts created' })
    public totalContracts: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: 'Total amount spent on contracts' })
    public totalSpent: number;

    @Column({ type: 'timestamp', nullable: true, comment: 'Last time this NPC generated demand' })
    public lastDemandGeneration: Date;

    @Column({ type: 'timestamp', nullable: true, comment: 'Next scheduled demand evaluation' })
    public nextDemandEvaluation: Date;

    @Column({ type: 'json', nullable: true, comment: 'Provider blacklist and ratings' })
    public providerHistory: {
        [providerId: string]: {
            rating: number;
            contractsCount: number;
            slaBreaches: number;
            lastInteraction: Date;
            blacklisted: boolean;
            blacklistReason?: string;
        };
    };

    @Column({ type: 'json', nullable: true, comment: 'Demand generation configuration' })
    public demandConfig: {
        baseChancePerTick?: number;
        seasonalMultipliers?: {
            [month: string]: number;
        };
        timeOfDayMultipliers?: {
            [hour: string]: number;
        };
        contractDurationPreference?: {
            min: number;
            max: number;
            preferred: number;
        };
    };

    public getId(): number {
        return this.id;
    }

    public setId(id: number): void {
        this.id = id;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public setUuid(uuid: string): void {
        this.uuid = uuid;
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getTier(): NPCTier {
        return this.tier;
    }

    public setTier(tier: NPCTier): void {
        this.tier = tier;
    }

    public getStatus(): NPCStatus {
        return this.status;
    }

    public setStatus(status: NPCStatus): void {
        this.status = status;
    }

    public getBehaviorType(): NPCBehaviorType {
        return this.behaviorType;
    }

    public setBehaviorType(behaviorType: NPCBehaviorType): void {
        this.behaviorType = behaviorType;
    }

    public getMonthlyBudget(): number {
        return this.monthlyBudget;
    }

    public setMonthlyBudget(budget: number): void {
        this.monthlyBudget = budget;
    }

    public getActiveContracts(): number {
        return this.activeContracts;
    }

    public setActiveContracts(count: number): void {
        this.activeContracts = count;
    }

    public incrementActiveContracts(): void {
        this.activeContracts++;
        this.totalContracts++;
    }

    public decrementActiveContracts(): void {
        if (this.activeContracts > 0) {
            this.activeContracts--;
        }
    }

    public addToTotalSpent(amount: number): void {
        this.totalSpent = Number(this.totalSpent) + amount;
    }

    public updateProviderRating(providerId: string, rating: number, slaBreached: boolean = false): void {
        if (!this.providerHistory) {
            this.providerHistory = {};
        }

        if (!this.providerHistory[providerId]) {
            this.providerHistory[providerId] = {
                rating: rating,
                contractsCount: 1,
                slaBreaches: slaBreached ? 1 : 0,
                lastInteraction: new Date(),
                blacklisted: false
            };
        } else {
            const history = this.providerHistory[providerId];
            history.rating = (history.rating + rating) / 2;
            history.contractsCount++;
            if (slaBreached) {
                history.slaBreaches++;
            }
            history.lastInteraction = new Date();

            if (history.slaBreaches >= 3 && history.rating < 2) {
                history.blacklisted = true;
                history.blacklistReason = 'Multiple SLA breaches with poor rating';
            }
        }
    }

    public isProviderBlacklisted(providerId: string): boolean {
        return this.providerHistory?.[providerId]?.blacklisted || false;
    }

    public getProviderRating(providerId: string): number {
        return this.providerHistory?.[providerId]?.rating || 0;
    }

    public canAffordContract(monthlyPrice: number): boolean {
        const currentSpending = this.activeContracts * (this.totalSpent / Math.max(this.totalContracts, 1));
        return (currentSpending + monthlyPrice) <= this.monthlyBudget && monthlyPrice <= this.maxContractBudget;
    }

    public meetsMinimumRequirements(uptimeSLA: number, latencyMs: number, reputationScore: number): boolean {
        return uptimeSLA >= this.minUptimeSLA && 
               latencyMs <= this.maxLatencyMs && 
               reputationScore >= this.minReputationScore;
    }
}