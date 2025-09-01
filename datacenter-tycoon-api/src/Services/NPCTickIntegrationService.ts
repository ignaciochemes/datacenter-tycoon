import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TickService, TickData } from './TickService';
import { NPCDemandGeneratorService } from './NPCDemandGeneratorService';
import { NPCContractEvaluatorService } from './NPCContractEvaluatorService';
import { ContractRevenueService } from './ContractRevenueService';
import { NPC } from '../Models/Entities/NPCEntity';
import { Contract } from '../Models/Entities/ContractEntity';
import { ContractStatus } from '../Enums/ServiceEnum';

@Injectable()
export class NPCTickIntegrationService implements OnModuleInit {
  private logger: Logger = new Logger('NPCTickIntegrationService');
  private tickCounter: number = 0;
  private readonly DEMAND_GENERATION_INTERVAL = 5;
  private readonly CONTRACT_EVALUATION_INTERVAL = 3;
  private readonly CONTRACT_RENEWAL_INTERVAL = 10;
  private readonly REVENUE_PROCESSING_INTERVAL = 30;

  constructor(
    private tickService: TickService,
    private npcDemandGenerator: NPCDemandGeneratorService,
    private npcContractEvaluator: NPCContractEvaluatorService,
    private contractRevenueService: ContractRevenueService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(NPC)
    private npcRepository: Repository<NPC>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  onModuleInit() {
    this.tickService.on('tick', this.handleTick.bind(this));
    this.logger.log('NPC Tick Integration Service initialized');
  }

  private async handleTick(tickData: TickData) {
    this.tickCounter++;
    this.logger.debug(`Processing NPC operations for tick ${tickData.tickNumber}`);

    try {
      await this.processNPCOperations(tickData);
    } catch (error) {
      this.logger.error(`Error processing NPC operations: ${error.message}`, error.stack);
    }
  }

  private async processNPCOperations(tickData: TickData) {
    const operations = [];

    if (this.tickCounter % this.DEMAND_GENERATION_INTERVAL === 0) {
      operations.push(this.processDemandGeneration(tickData));
    }

    if (this.tickCounter % this.CONTRACT_EVALUATION_INTERVAL === 0) {
      operations.push(this.processContractEvaluation(tickData));
    }

    if (this.tickCounter % this.CONTRACT_RENEWAL_INTERVAL === 0) {
      operations.push(this.processContractRenewals(tickData));
    }

    if (this.tickCounter % this.REVENUE_PROCESSING_INTERVAL === 0) {
      operations.push(this.processRevenueAndPenalties(tickData));
    }

    operations.push(this.processActiveContracts(tickData));

    await Promise.all(operations);
  }

  private async processDemandGeneration(tickData: TickData) {
    this.logger.debug('Processing NPC demand generation');
    
    try {
      const demandResults = await this.npcDemandGenerator.generateDemandForAllNPCs();
      
      if (demandResults.length > 0) {
        this.logger.log(`Generated ${demandResults.length} new demand requests`);
        
        this.gameGateway.broadcastToAll('npc-demand-generated', {
          tick: tickData.tickNumber,
          timestamp: tickData.timestamp,
          demandCount: demandResults.length,
          demands: demandResults.map(result => ({
            npcId: result.npcId,
            serviceType: result.serviceType,
            demandGenerated: result.demandGenerated,
            reason: result.reason
          }))
        });
      }
    } catch (error) {
      this.logger.error(`Error in demand generation: ${error.message}`);
    }
  }

  private async processContractEvaluation(tickData: TickData) {
    this.logger.debug('Processing NPC contract evaluations');
    
    try {
      const npcsWithPendingEvaluations = await this.npcRepository.find({
        where: {
          nextDemandEvaluation: tickData.timestamp
        }
      });

      for (const npc of npcsWithPendingEvaluations) {
        this.logger.log(`NPC ${npc.id} is evaluating available services`);
        
        this.gameGateway.broadcastToAll('npc-contract-evaluation', {
          tick: tickData.tickNumber,
          timestamp: tickData.timestamp,
          npcId: npc.id,
          evaluationsCount: 0
        });
      }
    } catch (error) {
      this.logger.error(`Error in contract evaluation: ${error.message}`);
    }
  }

  private async processContractRenewals(tickData: TickData) {
    this.logger.debug('Processing NPC contract renewals');
    
    try {
      const expiringContracts = await this.contractRepository.find({
        where: {
          endDate: tickData.timestamp,
          status: ContractStatus.ACTIVE
        },
        relations: ['clientId', 'serviceId']
      });

      for (const contract of expiringContracts) {
        if (contract.clientId) {
          const renewalResult = await this.npcContractEvaluator.evaluateContractRenewal(
            contract.id
          );
          
          this.gameGateway.broadcastToAll('npc-contract-renewal', {
            tick: tickData.tickNumber,
            timestamp: tickData.timestamp,
            contractId: contract.id,
            npcId: contract.clientId.id,
            renewed: renewalResult.accepted,
            reason: renewalResult.reason
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error in contract renewals: ${error.message}`);
    }
  }

  private async processActiveContracts(tickData: TickData) {
    try {
      const activeContracts = await this.contractRepository.find({
        where: {
          status: ContractStatus.ACTIVE
        },
        relations: ['clientId', 'serviceId']
      });

      const contractUpdates = [];

      for (const contract of activeContracts) {
        if (contract.clientId && contract.serviceId) {
          const performanceCheck = await this.evaluateContractPerformance(contract);
          
          if (!performanceCheck.meetsSLA) {
            await this.npcContractEvaluator.cancelContract(
              contract.id,
              performanceCheck.reason
            );
            
            contractUpdates.push({
              contractId: contract.id,
              action: 'cancelled',
              reason: performanceCheck.reason
            });
          }
        }
      }

      if (contractUpdates.length > 0) {
        this.gameGateway.broadcastToAll('npc-contract-updates', {
          tick: tickData.tickNumber,
          timestamp: tickData.timestamp,
          updates: contractUpdates
        });
      }
    } catch (error) {
      this.logger.error(`Error processing active contracts: ${error.message}`);
    }
  }

  private async evaluateContractPerformance(contract: Contract): Promise<{
    meetsSLA: boolean;
    reason?: string;
    uptimePercentage?: number;
    averageLatency?: number;
  }> {
    const currentUptime = Math.random() * 100;
    const currentLatency = Math.random() * 1000;
    
    const meetsSLA = 
      currentUptime >= contract.guaranteedUptimePercent &&
      currentLatency <= contract.maxLatencyMs;

    return {
      meetsSLA,
      reason: !meetsSLA ? 
        `SLA breach: Uptime ${currentUptime.toFixed(2)}% (required ${contract.guaranteedUptimePercent}%), Latency ${currentLatency.toFixed(2)}ms (max ${contract.maxLatencyMs}ms)` : 
        undefined,
      uptimePercentage: currentUptime,
      averageLatency: currentLatency
    };
  }

  async getIntegrationStatus() {
    const npcCount = await this.npcRepository.count();
    const activeContractsCount = await this.contractRepository.count({
      where: { status: ContractStatus.ACTIVE }
    });

    return {
      isActive: this.tickService.isTickingActive(),
      currentTick: this.tickService.getCurrentTick(),
      tickCounter: this.tickCounter,
      npcCount,
      activeContractsCount,
      intervals: {
        demandGeneration: this.DEMAND_GENERATION_INTERVAL,
        contractEvaluation: this.CONTRACT_EVALUATION_INTERVAL,
        contractRenewal: this.CONTRACT_RENEWAL_INTERVAL,
        revenueProcessing: this.REVENUE_PROCESSING_INTERVAL
      }
    };
  }

  private async processRevenueAndPenalties(tickData: TickData) {
    this.logger.debug('Processing contract revenue and penalties');
    
    try {
      const revenueResults = await this.contractRevenueService.processAllContractRevenue();
      
      if (revenueResults.length > 0) {
        this.logger.log(`Processed revenue for ${revenueResults.length} contracts`);
        
        this.eventEmitter.emit('npc-revenue-processed', {
          tick: tickData.tickNumber,
          timestamp: tickData.timestamp,
          contractsProcessed: revenueResults.length,
          totalRevenue: revenueResults.reduce((sum, result) => sum + result.revenue, 0),
          totalPenalties: revenueResults.reduce((sum, result) => sum + result.penalties, 0)
        });
      }
    } catch (error) {
      this.logger.error(`Error processing revenue and penalties: ${error.message}`);
    }
  }

  async updateIntervals(intervals: {
    demandGeneration?: number;
    contractEvaluation?: number;
    contractRenewal?: number;
    revenueProcessing?: number;
  }) {
    if (intervals.demandGeneration) {
      (this as any).DEMAND_GENERATION_INTERVAL = intervals.demandGeneration;
    }
    if (intervals.contractEvaluation) {
      (this as any).CONTRACT_EVALUATION_INTERVAL = intervals.contractEvaluation;
    }
    if (intervals.contractRenewal) {
      (this as any).CONTRACT_RENEWAL_INTERVAL = intervals.contractRenewal;
    }
    if (intervals.revenueProcessing) {
      (this as any).REVENUE_PROCESSING_INTERVAL = intervals.revenueProcessing;
    }

    this.logger.log('Updated NPC operation intervals', intervals);
  }
}