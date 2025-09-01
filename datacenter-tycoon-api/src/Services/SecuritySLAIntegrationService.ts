import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirewallRule } from '../Models/Entities/FirewallRuleEntity';
import { LoadBalancer } from '../Models/Entities/LoadBalancerEntity';
import { Contract } from '../Models/Entities/ContractEntity';
import { Service } from '../Models/Entities/ServiceEntity';
import { Datacenter } from '../Models/Entities/DatacenterEntity';
import { FirewallRuleService } from './FirewallRuleService';
import { LoadBalancerService } from './LoadBalancerService';
import { ContractService } from './ContractService';
import { FirewallRuleStatus, LoadBalancerStatus } from '../Models/Enums/NetworkEnum';
import { ContractStatus } from '../Enums/ServiceEnum';

export interface SecurityImpactMetrics {
  securityScore: number;
  availabilityImpact: number;
  performanceImpact: number;
  reliabilityScore: number;
  uptimeBonus: number;
  latencyReduction: number;
  throughputImprovement: number;
}

export interface SLASecurityAdjustment {
  contractId: number;
  originalUptime: number;
  adjustedUptime: number;
  originalLatency: number;
  adjustedLatency: number;
  originalThroughput: number;
  adjustedThroughput: number;
  securityBonus: number;
  reason: string;
}

@Injectable()
export class SecuritySLAIntegrationService {
  private logger: Logger = new Logger('SecuritySLAIntegrationService');

  constructor(
    @InjectRepository(FirewallRule)
    private firewallRuleRepository: Repository<FirewallRule>,
    @InjectRepository(LoadBalancer)
    private loadBalancerRepository: Repository<LoadBalancer>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Datacenter)
    private datacenterRepository: Repository<Datacenter>,
    private firewallRuleService: FirewallRuleService,
    private loadBalancerService: LoadBalancerService,
    private contractService: ContractService,
  ) {}

  async calculateSecurityImpactForDatacenter(datacenterId: number, userId: number): Promise<SecurityImpactMetrics> {
    try {
      const firewallImpact = await this.firewallRuleService.calculateSecurityImpact(userId, datacenterId);
      const loadBalancerImpact = await this.loadBalancerService.calculateLoadBalancerImpact(userId, datacenterId);

      const securityScore = this.calculateOverallSecurityScore(firewallImpact, loadBalancerImpact);
      const availabilityImpact = this.calculateAvailabilityImpact(firewallImpact, loadBalancerImpact);
      const performanceImpact = this.calculatePerformanceImpact(firewallImpact, loadBalancerImpact);
      const reliabilityScore = this.calculateReliabilityScore(firewallImpact, loadBalancerImpact);

      const uptimeBonus = this.calculateUptimeBonus(securityScore, availabilityImpact);
      const latencyReduction = this.calculateLatencyReduction(performanceImpact, loadBalancerImpact.latencyReduction);
      const throughputImprovement = this.calculateThroughputImprovement(performanceImpact, loadBalancerImpact.throughputIncrease);

      return {
        securityScore,
        availabilityImpact,
        performanceImpact,
        reliabilityScore,
        uptimeBonus,
        latencyReduction,
        throughputImprovement,
      };
    } catch (error) {
      this.logger.error(`Error calculating security impact for datacenter ${datacenterId}: ${error.message}`);
      throw error;
    }
  }

  async applySLASecurityAdjustments(userId: number): Promise<SLASecurityAdjustment[]> {
    try {
      const activeContracts = await this.contractRepository.find({
        where: {
          userId,
          status: ContractStatus.ACTIVE,
        },
        relations: ['serviceId', 'serviceId.datacenterId'],
      });

      const adjustments: SLASecurityAdjustment[] = [];

      for (const contract of activeContracts) {
        if (contract.serviceId?.datacenterId) {
          const securityMetrics = await this.calculateSecurityImpactForDatacenter(
            contract.serviceId.datacenterId.id,
            userId,
          );

          const adjustment = await this.calculateSLAAdjustment(contract, securityMetrics);
          if (adjustment) {
            adjustments.push(adjustment);
            await this.updateContractWithSecurityAdjustments(contract, adjustment);
          }
        }
      }

      return adjustments;
    } catch (error) {
      this.logger.error(`Error applying SLA security adjustments: ${error.message}`);
      throw error;
    }
  }

  async getSecurityStatusForContract(contractId: number): Promise<{
    hasFirewallProtection: boolean;
    hasLoadBalancer: boolean;
    securityScore: number;
    recommendedImprovements: string[];
  }> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id: contractId },
        relations: ['serviceId', 'serviceId.datacenterId'],
      });

      if (!contract?.serviceId?.datacenterId) {
        throw new Error('Contract or associated datacenter not found');
      }

      const datacenterId = contract.serviceId.datacenterId.id;
      const userId = contract.userId;

      const activeFirewallRules = await this.firewallRuleRepository.count({
        where: {
          userId,
          datacenterId,
          status: FirewallRuleStatus.ACTIVE,
          enabled: true,
        },
      });

      const activeLoadBalancers = await this.loadBalancerRepository.count({
        where: {
          userId,
          datacenterId,
          status: LoadBalancerStatus.ACTIVE,
          enabled: true,
        },
      });

      const securityMetrics = await this.calculateSecurityImpactForDatacenter(datacenterId, userId);
      const recommendations = this.generateSecurityRecommendations(
        activeFirewallRules,
        activeLoadBalancers,
        securityMetrics,
      );

      return {
        hasFirewallProtection: activeFirewallRules > 0,
        hasLoadBalancer: activeLoadBalancers > 0,
        securityScore: securityMetrics.securityScore,
        recommendedImprovements: recommendations,
      };
    } catch (error) {
      this.logger.error(`Error getting security status for contract ${contractId}: ${error.message}`);
      throw error;
    }
  }

  private calculateOverallSecurityScore(firewallImpact: any, loadBalancerImpact: any): number {
    const firewallScore = firewallImpact.securityScore || 0;
    const loadBalancerScore = loadBalancerImpact.reliabilityScore || 0;
    
    const weightedScore = (firewallScore * 0.6) + (loadBalancerScore * 0.4);
    return Math.min(100, Math.max(0, weightedScore));
  }

  private calculateAvailabilityImpact(firewallImpact: any, loadBalancerImpact: any): number {
    const firewallAvailability = firewallImpact.availabilityImpact || 0;
    const loadBalancerAvailability = loadBalancerImpact.availabilityImprovement || 0;
    
    return Math.min(100, firewallAvailability + loadBalancerAvailability);
  }

  private calculatePerformanceImpact(firewallImpact: any, loadBalancerImpact: any): number {
    const firewallPerformance = firewallImpact.performanceImpact || 0;
    const loadBalancerPerformance = loadBalancerImpact.performanceScore || 0;
    
    return (firewallPerformance + loadBalancerPerformance) / 2;
  }

  private calculateReliabilityScore(firewallImpact: any, loadBalancerImpact: any): number {
    const firewallReliability = firewallImpact.reliabilityScore || 0;
    const loadBalancerReliability = loadBalancerImpact.reliabilityScore || 0;
    
    return Math.max(firewallReliability, loadBalancerReliability);
  }

  private calculateUptimeBonus(securityScore: number, availabilityImpact: number): number {
    const baseBonus = (securityScore / 100) * 2;
    const availabilityBonus = (availabilityImpact / 100) * 1.5;
    
    return Math.min(5, baseBonus + availabilityBonus);
  }

  private calculateLatencyReduction(performanceImpact: number, loadBalancerLatencyReduction: number): number {
    const performanceReduction = (performanceImpact / 100) * 20;
    return Math.min(50, performanceReduction + (loadBalancerLatencyReduction || 0));
  }

  private calculateThroughputImprovement(performanceImpact: number, loadBalancerThroughputIncrease: number): number {
    const performanceImprovement = (performanceImpact / 100) * 15;
    return Math.min(30, performanceImprovement + (loadBalancerThroughputIncrease || 0));
  }

  private async calculateSLAAdjustment(
    contract: Contract,
    securityMetrics: SecurityImpactMetrics,
  ): Promise<SLASecurityAdjustment | null> {
    const securityBonus = securityMetrics.securityScore / 100;
    
    if (securityBonus < 0.1) {
      return null;
    }

    const adjustedUptime = Math.min(99.99, contract.guaranteedUptimePercent + securityMetrics.uptimeBonus);
    const adjustedLatency = Math.max(1, contract.maxLatencyMs - securityMetrics.latencyReduction);
    const adjustedThroughput = contract.minThroughputMbps + (contract.minThroughputMbps * securityMetrics.throughputImprovement / 100);

    return {
      contractId: contract.id,
      originalUptime: contract.guaranteedUptimePercent,
      adjustedUptime,
      originalLatency: contract.maxLatencyMs,
      adjustedLatency,
      originalThroughput: contract.minThroughputMbps,
      adjustedThroughput,
      securityBonus,
      reason: `Security improvements: ${securityMetrics.securityScore.toFixed(1)}% security score`,
    };
  }

  private async updateContractWithSecurityAdjustments(
    contract: Contract,
    adjustment: SLASecurityAdjustment,
  ): Promise<void> {
    contract.guaranteedUptimePercent = adjustment.adjustedUptime;
    contract.maxLatencyMs = adjustment.adjustedLatency;
    contract.minThroughputMbps = adjustment.adjustedThroughput;
    contract.updatedAt = new Date();

    await this.contractRepository.save(contract);
    
    this.logger.log(
      `Updated contract ${contract.id} with security adjustments: ` +
      `uptime ${adjustment.originalUptime}% -> ${adjustment.adjustedUptime}%, ` +
      `latency ${adjustment.originalLatency}ms -> ${adjustment.adjustedLatency}ms`,
    );
  }

  private generateSecurityRecommendations(
    firewallRulesCount: number,
    loadBalancersCount: number,
    securityMetrics: SecurityImpactMetrics,
  ): string[] {
    const recommendations: string[] = [];

    if (firewallRulesCount === 0) {
      recommendations.push('Add firewall rules to improve security and reduce attack surface');
    } else if (firewallRulesCount < 5) {
      recommendations.push('Consider adding more comprehensive firewall rules for better protection');
    }

    if (loadBalancersCount === 0) {
      recommendations.push('Implement load balancing to improve availability and performance');
    }

    if (securityMetrics.securityScore < 50) {
      recommendations.push('Security score is low - review and strengthen security configurations');
    }

    if (securityMetrics.availabilityImpact < 30) {
      recommendations.push('Improve availability measures to enhance SLA compliance');
    }

    if (securityMetrics.performanceImpact < 40) {
      recommendations.push('Optimize performance configurations to reduce latency and improve throughput');
    }

    return recommendations;
  }

  async processSecurityTickEvaluation(userId: number): Promise<{
    contractsEvaluated: number;
    adjustmentsApplied: number;
    securityIssuesDetected: number;
  }> {
    try {
      const adjustments = await this.applySLASecurityAdjustments(userId);
      
      const activeContracts = await this.contractRepository.count({
        where: {
          userId,
          status: ContractStatus.ACTIVE,
        },
      });

      const securityIssues = adjustments.filter(adj => adj.securityBonus < 0.3).length;

      return {
        contractsEvaluated: activeContracts,
        adjustmentsApplied: adjustments.length,
        securityIssuesDetected: securityIssues,
      };
    } catch (error) {
      this.logger.error(`Error processing security tick evaluation: ${error.message}`);
      throw error;
    }
  }
}