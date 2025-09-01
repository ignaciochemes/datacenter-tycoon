import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NPC } from '../Models/Entities/NPCEntity';
import { NPCTier, NPCStatus, NPCBehaviorType, NPCDemandFrequency, NPCRiskTolerance } from '../Enums/NPCEnum';
import * as fs from 'fs';
import * as path from 'path';

interface NPCItem {
  id: string;
  name: string;
  tier: NPCTier;
  status: NPCStatus;
  behaviorType: NPCBehaviorType;
  demandFrequency: NPCDemandFrequency;
  riskTolerance: NPCRiskTolerance;
  monthlyBudget: number;
  maxContractBudget: number;
  minUptimeSLA: number;
  maxLatencyMs: number;
  minReputationScore: number;
  preferredServices: string[];
  servicePreferences: Record<string, any>;
  evaluationWeights: {
    price: number;
    sla: number;
    reputation: number;
  };
  currentReputationScore: number;
  demandConfig: {
    baseChance: number;
    seasonalMultiplier: number;
    hourlyMultiplier: number;
  };
}

interface NPCCatalog {
  catalogs: Record<string, string>;
  tiers: Record<string, any>;
  behaviorTypes: Record<string, any>;
  metadata: Record<string, any>;
}

@Injectable()
export class NPCSeedingService {
  constructor(
    @InjectRepository(NPC)
    private npcRepository: Repository<NPC>,
  ) {}

  async seedNPCCatalog(): Promise<void> {
    try {
      const seedsPath = path.join(__dirname, '../Seeds/NPCs');
      const indexPath = path.join(seedsPath, 'index.json');
      
      if (!fs.existsSync(indexPath)) {
        throw new Error('NPC catalog index not found');
      }

      const catalogIndex: NPCCatalog = JSON.parse(
        fs.readFileSync(indexPath, 'utf8')
      );

      console.log('Starting NPC catalog seeding...');
      let totalSeeded = 0;

      for (const [catalogName, catalogFile] of Object.entries(catalogIndex.catalogs)) {
        const catalogPath = path.join(seedsPath, catalogFile.replace('./', ''));
        
        if (!fs.existsSync(catalogPath)) {
          console.warn(`Catalog file not found: ${catalogPath}`);
          continue;
        }

        const npcItems: NPCItem[] = JSON.parse(
          fs.readFileSync(catalogPath, 'utf8')
        );

        console.log(`Seeding ${catalogName} catalog with ${npcItems.length} NPCs...`);

        for (const item of npcItems) {
          await this.createOrUpdateNPC(item);
          totalSeeded++;
        }
      }

      console.log(`NPC catalog seeding completed. Total NPCs seeded: ${totalSeeded}`);
    } catch (error) {
      console.error('Error seeding NPC catalog:', error);
      throw error;
    }
  }

  private async createOrUpdateNPC(item: NPCItem): Promise<void> {
    try {
      let npc = await this.npcRepository.findOne({
        where: { uuid: item.id }
      });

      if (!npc) {
        npc = new NPC();
        npc.uuid = item.id;
      }

      npc.name = item.name;
      npc.tier = item.tier;
      npc.status = item.status;
      npc.behaviorType = item.behaviorType;
      npc.demandFrequency = item.demandFrequency;
      npc.riskTolerance = item.riskTolerance;
      npc.monthlyBudget = item.monthlyBudget;
      npc.maxContractBudget = item.maxContractBudget;
      npc.minUptimeSLA = item.minUptimeSLA;
      npc.maxLatencyMs = item.maxLatencyMs;
      npc.minReputationScore = item.minReputationScore;
      npc.preferredServices = [];
      npc.servicePreferences = item.servicePreferences || {};
      npc.evaluationWeights = item.evaluationWeights;
      npc.currentReputationScore = item.currentReputationScore;
      npc.demandConfig = {
        baseChancePerTick: item.demandConfig?.baseChance || 0.1,
        seasonalMultipliers: {},
        timeOfDayMultipliers: {},
        contractDurationPreference: {
          min: 30,
          max: 365,
          preferred: 90
        }
      };
      
      npc.totalSpent = 0;
      npc.activeContracts = 0;
      npc.totalContracts = 0;
      npc.lastDemandGeneration = null;
      npc.nextDemandEvaluation = new Date();
      npc.providerHistory = {};

      await this.npcRepository.save(npc);
      console.log(`NPC ${item.name} (${item.id}) seeded successfully`);
    } catch (error) {
      console.error(`Error seeding NPC ${item.name}:`, error);
      throw error;
    }
  }

  async clearNPCCatalog(): Promise<void> {
    try {
      console.log('Clearing NPC catalog...');
      await this.npcRepository.clear();
      console.log('NPC catalog cleared successfully');
    } catch (error) {
      console.error('Error clearing NPC catalog:', error);
      throw error;
    }
  }

  async reseedNPCCatalog(): Promise<void> {
    try {
      console.log('Reseeding NPC catalog...');
      await this.clearNPCCatalog();
      await this.seedNPCCatalog();
      console.log('NPC catalog reseeded successfully');
    } catch (error) {
      console.error('Error reseeding NPC catalog:', error);
      throw error;
    }
  }

  async getNPCCatalogStats(): Promise<any> {
    try {
      const totalNPCs = await this.npcRepository.count();
      const npcsByTier = await this.npcRepository
        .createQueryBuilder('npc')
        .select('npc.tier', 'tier')
        .addSelect('COUNT(*)', 'count')
        .groupBy('npc.tier')
        .getRawMany();

      const npcsByBehavior = await this.npcRepository
        .createQueryBuilder('npc')
        .select('npc.behaviorType', 'behaviorType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('npc.behaviorType')
        .getRawMany();

      const npcsByStatus = await this.npcRepository
        .createQueryBuilder('npc')
        .select('npc.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('npc.status')
        .getRawMany();

      return {
        totalNPCs,
        byTier: npcsByTier,
        byBehavior: npcsByBehavior,
        byStatus: npcsByStatus,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting NPC catalog stats:', error);
      throw error;
    }
  }
}