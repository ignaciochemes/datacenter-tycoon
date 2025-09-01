import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirewallRule } from '../Models/Entities/FirewallRuleEntity';
import { LoadBalancer } from '../Models/Entities/LoadBalancerEntity';
import { Contract } from '../Models/Entities/ContractEntity';
import { User } from '../Models/Entities/UserEntity';
import { SecuritySLAIntegrationService } from './SecuritySLAIntegrationService';
import { FirewallRuleService } from './FirewallRuleService';
import { LoadBalancerService } from './LoadBalancerService';
import { FirewallRuleStatus, LoadBalancerStatus } from '../Models/Enums/NetworkEnum';
import { ContractStatus } from '../Enums/ServiceEnum';

export interface SecurityTickResult {
  userId: number;
  timestamp: Date;
  firewallRulesProcessed: number;
  loadBalancersProcessed: number;
  contractsAdjusted: number;
  securityIncidents: SecurityIncident[];
  performanceMetrics: SecurityPerformanceMetrics;
}

export interface SecurityIncident {
  type: 'FIREWALL_BREACH' | 'LOAD_BALANCER_FAILURE' | 'SLA_VIOLATION' | 'SECURITY_DEGRADATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedContracts: number[];
  timestamp: Date;
  resolved: boolean;
}

export interface SecurityPerformanceMetrics {
  averageSecurityScore: number;
  totalFirewallRules: number;
  activeFirewallRules: number;
  totalLoadBalancers: number;
  activeLoadBalancers: number;
  slaComplianceRate: number;
  securityIncidentCount: number;
  performanceImprovementPercent: number;
}

@Injectable()
export class SecurityTickIntegrationService {
  private logger: Logger = new Logger('SecurityTickIntegrationService');
  private lastTickTimestamp: Date = new Date();
  private securityIncidents: Map<number, SecurityIncident[]> = new Map();

  constructor(
    @InjectRepository(FirewallRule)
    private firewallRuleRepository: Repository<FirewallRule>,
    @InjectRepository(LoadBalancer)
    private loadBalancerRepository: Repository<LoadBalancer>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private securitySLAIntegrationService: SecuritySLAIntegrationService,
    private firewallRuleService: FirewallRuleService,
    private loadBalancerService: LoadBalancerService,
  ) {}

  async processSecurityTick(): Promise<SecurityTickResult[]> {
    try {
      this.logger.log('Starting security tick evaluation...');
      const currentTime = new Date();
      
      const activeUsers = await this.userRepository.find({
        where: { isActive: true },
      });

      const results: SecurityTickResult[] = [];

      for (const user of activeUsers) {
        try {
          const userResult = await this.processUserSecurityTick(user.id, currentTime);
          results.push(userResult);
        } catch (error) {
          this.logger.error(`Error processing security tick for user ${user.id}: ${error.message}`);
        }
      }

      this.lastTickTimestamp = currentTime;
      this.logger.log(`Security tick completed. Processed ${results.length} users.`);
      
      return results;
    } catch (error) {
      this.logger.error(`Error in security tick process: ${error.message}`);
      throw error;
    }
  }

  async processUserSecurityTick(userId: number, timestamp: Date): Promise<SecurityTickResult> {
    try {
      const firewallRulesProcessed = await this.evaluateFirewallRules(userId);
      const loadBalancersProcessed = await this.evaluateLoadBalancers(userId);
      const contractsAdjusted = await this.processContractAdjustments(userId);
      const securityIncidents = await this.detectSecurityIncidents(userId, timestamp);
      const performanceMetrics = await this.calculatePerformanceMetrics(userId);

      await this.updateSecurityMetrics(userId, performanceMetrics);

      return {
        userId,
        timestamp,
        firewallRulesProcessed,
        loadBalancersProcessed,
        contractsAdjusted,
        securityIncidents,
        performanceMetrics,
      };
    } catch (error) {
      this.logger.error(`Error processing user security tick for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  private async evaluateFirewallRules(userId: number): Promise<number> {
    try {
      const firewallRules = await this.firewallRuleRepository.find({
        where: {
          userId,
          status: FirewallRuleStatus.ACTIVE,
          enabled: true,
        },
      });

      let processedCount = 0;

      for (const rule of firewallRules) {
        try {
          await this.evaluateFirewallRulePerformance(rule);
          await this.checkFirewallRuleExpiration(rule);
          processedCount++;
        } catch (error) {
          this.logger.warn(`Error evaluating firewall rule ${rule.id}: ${error.message}`);
        }
      }

      return processedCount;
    } catch (error) {
      this.logger.error(`Error evaluating firewall rules for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  private async evaluateLoadBalancers(userId: number): Promise<number> {
    try {
      const loadBalancers = await this.loadBalancerRepository.find({
        where: {
          userId,
          status: LoadBalancerStatus.ACTIVE,
          enabled: true,
        },
      });

      let processedCount = 0;

      for (const loadBalancer of loadBalancers) {
        try {
          await this.evaluateLoadBalancerHealth(loadBalancer);
          await this.updateLoadBalancerMetrics(loadBalancer);
          processedCount++;
        } catch (error) {
          this.logger.warn(`Error evaluating load balancer ${loadBalancer.id}: ${error.message}`);
        }
      }

      return processedCount;
    } catch (error) {
      this.logger.error(`Error evaluating load balancers for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  private async processContractAdjustments(userId: number): Promise<number> {
    try {
      const adjustments = await this.securitySLAIntegrationService.applySLASecurityAdjustments(userId);
      return adjustments.length;
    } catch (error) {
      this.logger.error(`Error processing contract adjustments for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  private async detectSecurityIncidents(userId: number, timestamp: Date): Promise<SecurityIncident[]> {
    const incidents: SecurityIncident[] = [];

    try {
      const firewallIncidents = await this.detectFirewallIncidents(userId, timestamp);
      const loadBalancerIncidents = await this.detectLoadBalancerIncidents(userId, timestamp);
      const slaIncidents = await this.detectSLAViolations(userId, timestamp);

      incidents.push(...firewallIncidents, ...loadBalancerIncidents, ...slaIncidents);

      if (!this.securityIncidents.has(userId)) {
        this.securityIncidents.set(userId, []);
      }
      this.securityIncidents.get(userId)!.push(...incidents);

      return incidents;
    } catch (error) {
      this.logger.error(`Error detecting security incidents for user ${userId}: ${error.message}`);
      return [];
    }
  }

  private async detectFirewallIncidents(userId: number, timestamp: Date): Promise<SecurityIncident[]> {
    const incidents: SecurityIncident[] = [];

    try {
      const failedRules = await this.firewallRuleRepository.find({
        where: {
          userId,
          status: FirewallRuleStatus.ERROR,
        },
      });

      for (const rule of failedRules) {
        incidents.push({
          type: 'FIREWALL_BREACH',
          severity: this.calculateFirewallSeverity(rule),
          description: `Firewall rule '${rule.name}' failed: ${rule.description}`,
          affectedContracts: await this.getAffectedContracts(userId, rule.datacenterId),
          timestamp,
          resolved: false,
        });
      }
    } catch (error) {
      this.logger.error(`Error detecting firewall incidents: ${error.message}`);
    }

    return incidents;
  }

  private async detectLoadBalancerIncidents(userId: number, timestamp: Date): Promise<SecurityIncident[]> {
    const incidents: SecurityIncident[] = [];

    try {
      const failedLoadBalancers = await this.loadBalancerRepository.find({
        where: {
          userId,
          status: LoadBalancerStatus.ERROR,
        },
      });

      for (const loadBalancer of failedLoadBalancers) {
        incidents.push({
          type: 'LOAD_BALANCER_FAILURE',
          severity: this.calculateLoadBalancerSeverity(loadBalancer),
          description: `Load balancer '${loadBalancer.name}' failed: ${loadBalancer.description}`,
          affectedContracts: await this.getAffectedContracts(userId, loadBalancer.datacenterId),
          timestamp,
          resolved: false,
        });
      }
    } catch (error) {
      this.logger.error(`Error detecting load balancer incidents: ${error.message}`);
    }

    return incidents;
  }

  private async detectSLAViolations(userId: number, timestamp: Date): Promise<SecurityIncident[]> {
    const incidents: SecurityIncident[] = [];

    try {
      const contracts = await this.contractRepository.find({
        where: {
          userId,
          status: ContractStatus.ACTIVE,
        },
      });

      for (const contract of contracts) {
        const securityStatus = await this.securitySLAIntegrationService.getSecurityStatusForContract(contract.id);
        
        if (securityStatus.securityScore < 30) {
          incidents.push({
            type: 'SECURITY_DEGRADATION',
            severity: 'HIGH',
            description: `Contract ${contract.id} has low security score: ${securityStatus.securityScore.toFixed(1)}%`,
            affectedContracts: [contract.id],
            timestamp,
            resolved: false,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error detecting SLA violations: ${error.message}`);
    }

    return incidents;
  }

  private async calculatePerformanceMetrics(userId: number): Promise<SecurityPerformanceMetrics> {
    try {
      const totalFirewallRules = await this.firewallRuleRepository.count({ where: { userId } });
      const activeFirewallRules = await this.firewallRuleRepository.count({
        where: { userId, status: FirewallRuleStatus.ACTIVE, enabled: true },
      });

      const totalLoadBalancers = await this.loadBalancerRepository.count({ where: { userId } });
      const activeLoadBalancers = await this.loadBalancerRepository.count({
        where: { userId, status: LoadBalancerStatus.ACTIVE, enabled: true },
      });

      const contracts = await this.contractRepository.find({
        where: { userId, status: ContractStatus.ACTIVE },
        relations: ['serviceId', 'serviceId.datacenterId'],
      });

      let totalSecurityScore = 0;
      let contractsWithSecurity = 0;
      let slaCompliantContracts = 0;

      for (const contract of contracts) {
        if (contract.serviceId?.datacenterId) {
          try {
            const securityMetrics = await this.securitySLAIntegrationService.calculateSecurityImpactForDatacenter(
              contract.serviceId.datacenterId.id,
              userId,
            );
            totalSecurityScore += securityMetrics.securityScore;
            contractsWithSecurity++;

            if (securityMetrics.securityScore >= 70) {
              slaCompliantContracts++;
            }
          } catch (error) {
            this.logger.warn(`Error calculating security for contract ${contract.id}: ${error.message}`);
          }
        }
      }

      const averageSecurityScore = contractsWithSecurity > 0 ? totalSecurityScore / contractsWithSecurity : 0;
      const slaComplianceRate = contracts.length > 0 ? (slaCompliantContracts / contracts.length) * 100 : 0;
      
      const userIncidents = this.securityIncidents.get(userId) || [];
      const recentIncidents = userIncidents.filter(
        incident => incident.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      const performanceImprovementPercent = this.calculatePerformanceImprovement(
        activeFirewallRules,
        activeLoadBalancers,
        averageSecurityScore,
      );

      return {
        averageSecurityScore,
        totalFirewallRules,
        activeFirewallRules,
        totalLoadBalancers,
        activeLoadBalancers,
        slaComplianceRate,
        securityIncidentCount: recentIncidents.length,
        performanceImprovementPercent,
      };
    } catch (error) {
      this.logger.error(`Error calculating performance metrics for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  private async evaluateFirewallRulePerformance(rule: FirewallRule): Promise<void> {
    if (rule.rateLimit && rule.rateLimit.enabled) {
      const currentTime = new Date();
      const timeDiff = currentTime.getTime() - rule.updatedAt.getTime();
      
      if (timeDiff > 60000) {
        rule.metrics = {
          ...rule.metrics,
          packetsProcessed: (rule.metrics?.packetsProcessed || 0) + Math.floor(Math.random() * 1000),
          packetsBlocked: (rule.metrics?.packetsBlocked || 0) + Math.floor(Math.random() * 100),
          lastActivity: currentTime,
        };
        
        await this.firewallRuleRepository.save(rule);
      }
    }
  }

  private async checkFirewallRuleExpiration(rule: FirewallRule): Promise<void> {
    if (rule.expirationDate && rule.expirationDate < new Date()) {
      rule.status = FirewallRuleStatus.EXPIRED;
      rule.enabled = false;
      rule.updatedAt = new Date();
      
      await this.firewallRuleRepository.save(rule);
      this.logger.log(`Firewall rule ${rule.id} expired and was disabled`);
    }
  }

  private async evaluateLoadBalancerHealth(loadBalancer: LoadBalancer): Promise<void> {
    if (loadBalancer.healthCheckConfig?.enabled) {
      const healthScore = Math.random() * 100;
      
      loadBalancer.metrics = {
        ...loadBalancer.metrics,
        healthScore,
        lastHealthCheck: new Date(),
        activeConnections: Math.floor(Math.random() * 1000),
        requestsPerSecond: Math.floor(Math.random() * 500),
      };
      
      if (healthScore < 30) {
        loadBalancer.status = LoadBalancerStatus.ERROR;
      } else if (healthScore < 70) {
        loadBalancer.status = LoadBalancerStatus.WARNING;
      } else {
        loadBalancer.status = LoadBalancerStatus.ACTIVE;
      }
      
      await this.loadBalancerRepository.save(loadBalancer);
    }
  }

  private async updateLoadBalancerMetrics(loadBalancer: LoadBalancer): Promise<void> {
    const currentTime = new Date();
    
    loadBalancer.metrics = {
      ...loadBalancer.metrics,
      totalRequests: (loadBalancer.metrics?.totalRequests || 0) + Math.floor(Math.random() * 100),
      averageResponseTime: Math.random() * 200 + 50,
      throughput: Math.random() * 1000 + 500,
      lastUpdated: currentTime,
    };
    
    await this.loadBalancerRepository.save(loadBalancer);
  }

  private calculateFirewallSeverity(rule: FirewallRule): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (rule.priority >= 90) return 'CRITICAL';
    if (rule.priority >= 70) return 'HIGH';
    if (rule.priority >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private calculateLoadBalancerSeverity(loadBalancer: LoadBalancer): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const backendCount = loadBalancer.backendServers?.length || 0;
    if (backendCount === 0) return 'CRITICAL';
    if (backendCount === 1) return 'HIGH';
    if (backendCount === 2) return 'MEDIUM';
    return 'LOW';
  }

  private async getAffectedContracts(userId: number, datacenterId: number): Promise<number[]> {
    try {
      const contracts = await this.contractRepository.find({
        where: {
          userId,
          status: ContractStatus.ACTIVE,
        },
        relations: ['serviceId', 'serviceId.datacenterId'],
      });

      return contracts
        .filter(contract => contract.serviceId?.datacenterId?.id === datacenterId)
        .map(contract => contract.id);
    } catch (error) {
      this.logger.error(`Error getting affected contracts: ${error.message}`);
      return [];
    }
  }

  private calculatePerformanceImprovement(
    activeFirewallRules: number,
    activeLoadBalancers: number,
    averageSecurityScore: number,
  ): number {
    const firewallBonus = Math.min(20, activeFirewallRules * 2);
    const loadBalancerBonus = Math.min(15, activeLoadBalancers * 5);
    const securityBonus = (averageSecurityScore / 100) * 10;
    
    return Math.min(50, firewallBonus + loadBalancerBonus + securityBonus);
  }

  private async updateSecurityMetrics(userId: number, metrics: SecurityPerformanceMetrics): Promise<void> {
    this.logger.log(
      `Security metrics for user ${userId}: ` +
      `Security Score: ${metrics.averageSecurityScore.toFixed(1)}%, ` +
      `SLA Compliance: ${metrics.slaComplianceRate.toFixed(1)}%, ` +
      `Active Rules: ${metrics.activeFirewallRules}/${metrics.totalFirewallRules}, ` +
      `Active LBs: ${metrics.activeLoadBalancers}/${metrics.totalLoadBalancers}`,
    );
  }

  getSecurityIncidents(userId: number): SecurityIncident[] {
    return this.securityIncidents.get(userId) || [];
  }

  clearResolvedIncidents(userId: number): void {
    const incidents = this.securityIncidents.get(userId) || [];
    const unresolvedIncidents = incidents.filter(incident => !incident.resolved);
    this.securityIncidents.set(userId, unresolvedIncidents);
  }

  resolveIncident(userId: number, incidentIndex: number): boolean {
    const incidents = this.securityIncidents.get(userId) || [];
    if (incidentIndex >= 0 && incidentIndex < incidents.length) {
      incidents[incidentIndex].resolved = true;
      return true;
    }
    return false;
  }
}