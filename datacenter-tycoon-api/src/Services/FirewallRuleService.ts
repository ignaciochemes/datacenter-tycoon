import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirewallRuleEntity } from '../Models/Entities/FirewallRuleEntity';
import { CreateFirewallRuleDto } from '../DTOs/CreateFirewallRuleDto';
import { UpdateFirewallRuleDto } from '../DTOs/UpdateFirewallRuleDto';
import { FirewallRuleStatus, FirewallAction } from '../Models/Enums/NetworkEnum';

@Injectable()
export class FirewallRuleService {
  constructor(
    @InjectRepository(FirewallRuleEntity)
    private readonly firewallRuleRepository: Repository<FirewallRuleEntity>,
  ) {}

  async create(createFirewallRuleDto: CreateFirewallRuleDto, userId: number): Promise<FirewallRuleEntity> {
    const firewallRule = this.firewallRuleRepository.create({
      ...createFirewallRuleDto,
      userId,
      status: FirewallRuleStatus.INACTIVE,
      enabled: false,
      createdAt: new Date(),
      lastModified: new Date(),
      createdBy: userId.toString(),
      lastModifiedBy: userId.toString(),
    });

    return await this.firewallRuleRepository.save(firewallRule);
  }

  async findAll(userId: number): Promise<FirewallRuleEntity[]> {
    return await this.firewallRuleRepository.find({
      where: { userId },
      relations: ['datacenter', 'device'],
      order: { priority: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByDatacenter(userId: number, datacenterId: number): Promise<FirewallRuleEntity[]> {
    return await this.firewallRuleRepository.find({
      where: { userId, datacenterId },
      relations: ['datacenter', 'device'],
      order: { priority: 'ASC', createdAt: 'DESC' },
    });
  }

  async findByDevice(userId: number, deviceId: number): Promise<FirewallRuleEntity[]> {
    return await this.firewallRuleRepository.find({
      where: { userId, deviceId },
      relations: ['datacenter', 'device'],
      order: { priority: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<FirewallRuleEntity> {
    const firewallRule = await this.firewallRuleRepository.findOne({
      where: { id, userId },
      relations: ['datacenter', 'device'],
    });

    if (!firewallRule) {
      throw new Error('Firewall rule not found');
    }

    return firewallRule;
  }

  async update(id: number, updateFirewallRuleDto: UpdateFirewallRuleDto, userId: number): Promise<FirewallRuleEntity> {
    const firewallRule = await this.findOne(id, userId);
    
    Object.assign(firewallRule, {
      ...updateFirewallRuleDto,
      lastModified: new Date(),
      lastModifiedBy: userId.toString(),
    });

    return await this.firewallRuleRepository.save(firewallRule);
  }

  async remove(id: number, userId: number): Promise<void> {
    const firewallRule = await this.findOne(id, userId);
    await this.firewallRuleRepository.remove(firewallRule);
  }

  async activate(id: number, userId: number): Promise<FirewallRuleEntity> {
    const firewallRule = await this.findOne(id, userId);
    
    firewallRule.status = FirewallRuleStatus.ACTIVE;
    firewallRule.enabled = true;
    firewallRule.activatedAt = new Date();
    firewallRule.lastModified = new Date();
    firewallRule.lastModifiedBy = userId.toString();

    return await this.firewallRuleRepository.save(firewallRule);
  }

  async deactivate(id: number, userId: number): Promise<FirewallRuleEntity> {
    const firewallRule = await this.findOne(id, userId);
    
    firewallRule.status = FirewallRuleStatus.INACTIVE;
    firewallRule.enabled = false;
    firewallRule.deactivatedAt = new Date();
    firewallRule.lastModified = new Date();
    firewallRule.lastModifiedBy = userId.toString();

    return await this.firewallRuleRepository.save(firewallRule);
  }

  async getActiveRules(userId: number, datacenterId?: number): Promise<FirewallRuleEntity[]> {
    const whereCondition: any = {
      userId,
      status: FirewallRuleStatus.ACTIVE,
      enabled: true,
    };

    if (datacenterId) {
      whereCondition.datacenterId = datacenterId;
    }

    return await this.firewallRuleRepository.find({
      where: whereCondition,
      relations: ['datacenter', 'device'],
      order: { priority: 'ASC' },
    });
  }

  async calculateSecurityImpact(userId: number, datacenterId: number): Promise<{
    totalRules: number;
    activeRules: number;
    blockingRules: number;
    allowingRules: number;
    securityScore: number;
    performanceImpact: number;
  }> {
    const allRules = await this.findByDatacenter(userId, datacenterId);
    const activeRules = allRules.filter(rule => rule.status === FirewallRuleStatus.ACTIVE && rule.enabled);
    
    const blockingRules = activeRules.filter(rule => rule.action === FirewallAction.DENY || rule.action === FirewallAction.DROP);
    const allowingRules = activeRules.filter(rule => rule.action === FirewallAction.ALLOW);
    
    const securityScore = this.calculateSecurityScore(activeRules);
    const performanceImpact = this.calculatePerformanceImpact(activeRules);

    return {
      totalRules: allRules.length,
      activeRules: activeRules.length,
      blockingRules: blockingRules.length,
      allowingRules: allowingRules.length,
      securityScore,
      performanceImpact,
    };
  }

  private calculateSecurityScore(rules: FirewallRuleEntity[]): number {
    if (rules.length === 0) return 0;
    
    let score = 0;
    const maxScore = 100;
    
    const blockingRules = rules.filter(rule => 
      rule.action === FirewallAction.DENY || rule.action === FirewallAction.DROP
    ).length;
    
    const allowingRules = rules.filter(rule => rule.action === FirewallAction.ALLOW).length;
    
    const blockingWeight = 0.7;
    const allowingWeight = 0.3;
    
    score = Math.min(maxScore, (blockingRules * blockingWeight + allowingRules * allowingWeight) * 10);
    
    return Math.round(score);
  }

  private calculatePerformanceImpact(rules: FirewallRuleEntity[]): number {
    if (rules.length === 0) return 0;
    
    let impact = 0;
    
    rules.forEach(rule => {
      impact += rule.priority || 1;
      
      if (rule.dpiConfig?.enabled) {
        impact += 5;
      }
      
      if (rule.rateLimitConfig?.enabled) {
        impact += 3;
      }
      
      if (rule.geoConfig?.enabled) {
        impact += 2;
      }
    });
    
    return Math.min(100, Math.round(impact / rules.length));
  }

  async updateRuleMetrics(ruleId: number, packetsProcessed: number, bytesProcessed: number, allowed: boolean): Promise<void> {
    const rule = await this.firewallRuleRepository.findOne({ where: { id: ruleId } });
    
    if (rule) {
      rule.packetsProcessed = (rule.packetsProcessed || 0) + packetsProcessed;
      rule.bytesProcessed = (rule.bytesProcessed || 0) + bytesProcessed;
      
      if (allowed) {
        rule.connectionsAllowed = (rule.connectionsAllowed || 0) + 1;
      } else {
        rule.connectionsBlocked = (rule.connectionsBlocked || 0) + 1;
      }
      
      rule.hitCount = (rule.hitCount || 0) + 1;
      rule.lastHit = new Date();
      
      if (!rule.firstHit) {
        rule.firstHit = new Date();
      }
      
      await this.firewallRuleRepository.save(rule);
    }
  }
}