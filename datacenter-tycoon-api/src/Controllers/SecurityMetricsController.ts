import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';
import { SecuritySLAIntegrationService } from '../Services/SecuritySLAIntegrationService';
import { SecurityTickIntegrationService } from '../Services/SecurityTickIntegrationService';
import { FirewallRuleService } from '../Services/FirewallRuleService';
import { LoadBalancerService } from '../Services/LoadBalancerService';

@ApiTags('Security Metrics')
@Controller('security-metrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SecurityMetricsController {
  constructor(
    private securitySLAIntegrationService: SecuritySLAIntegrationService,
    private securityTickIntegrationService: SecurityTickIntegrationService,
    private firewallRuleService: FirewallRuleService,
    private loadBalancerService: LoadBalancerService,
  ) {}

  @Get('datacenter/:datacenterId/impact')
  @ApiOperation({ summary: 'Get security impact metrics for a datacenter' })
  @ApiParam({ name: 'datacenterId', description: 'Datacenter ID' })
  @ApiResponse({ status: 200, description: 'Security impact metrics retrieved successfully' })
  async getDatacenterSecurityImpact(
    @Param('datacenterId') datacenterId: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    return await this.securitySLAIntegrationService.calculateSecurityImpactForDatacenter(datacenterId, userId);
  }

  @Get('sla-adjustments')
  @ApiOperation({ summary: 'Get current SLA security adjustments' })
  @ApiResponse({ status: 200, description: 'SLA adjustments retrieved successfully' })
  async getSLASecurityAdjustments(@Request() req: any) {
    const userId = req.user.userId;
    return await this.securitySLAIntegrationService.applySLASecurityAdjustments(userId);
  }

  @Get('contract/:contractId/status')
  @ApiOperation({ summary: 'Get security status for a specific contract' })
  @ApiParam({ name: 'contractId', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract security status retrieved successfully' })
  async getContractSecurityStatus(@Param('contractId') contractId: number) {
    return await this.securitySLAIntegrationService.getSecurityStatusForContract(contractId);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get security incidents for the user' })
  @ApiQuery({ name: 'resolved', required: false, description: 'Filter by resolved status' })
  @ApiResponse({ status: 200, description: 'Security incidents retrieved successfully' })
  async getSecurityIncidents(
    @Request() req: any,
    @Query('resolved') resolved?: boolean,
  ) {
    const userId = req.user.userId;
    const incidents = this.securityTickIntegrationService.getSecurityIncidents(userId);
    
    if (resolved !== undefined) {
      return incidents.filter(incident => incident.resolved === resolved);
    }
    
    return incidents;
  }

  @Post('incidents/:incidentIndex/resolve')
  @ApiOperation({ summary: 'Mark a security incident as resolved' })
  @ApiParam({ name: 'incidentIndex', description: 'Incident index' })
  @ApiResponse({ status: 200, description: 'Incident resolved successfully' })
  async resolveSecurityIncident(
    @Param('incidentIndex') incidentIndex: number,
    @Request() req: any,
  ) {
    const userId = req.user.userId;
    const resolved = this.securityTickIntegrationService.resolveIncident(userId, incidentIndex);
    
    return {
      success: resolved,
      message: resolved ? 'Incident resolved successfully' : 'Incident not found or already resolved',
    };
  }

  @Post('incidents/clear-resolved')
  @ApiOperation({ summary: 'Clear all resolved security incidents' })
  @ApiResponse({ status: 200, description: 'Resolved incidents cleared successfully' })
  async clearResolvedIncidents(@Request() req: any) {
    const userId = req.user.userId;
    this.securityTickIntegrationService.clearResolvedIncidents(userId);
    
    return {
      success: true,
      message: 'Resolved incidents cleared successfully',
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive security dashboard data' })
  @ApiResponse({ status: 200, description: 'Security dashboard data retrieved successfully' })
  async getSecurityDashboard(@Request() req: any) {
    const userId = req.user.userId;
    
    const [incidents, firewallImpact, loadBalancerImpact] = await Promise.all([
      this.securityTickIntegrationService.getSecurityIncidents(userId),
      this.firewallRuleService.calculateSecurityImpact(userId),
      this.loadBalancerService.calculateLoadBalancerImpact(userId),
    ]);

    const activeIncidents = incidents.filter(incident => !incident.resolved);
    const criticalIncidents = activeIncidents.filter(incident => incident.severity === 'CRITICAL');
    const highIncidents = activeIncidents.filter(incident => incident.severity === 'HIGH');

    return {
      overview: {
        totalIncidents: incidents.length,
        activeIncidents: activeIncidents.length,
        criticalIncidents: criticalIncidents.length,
        highIncidents: highIncidents.length,
        securityScore: firewallImpact.securityScore || 0,
        reliabilityScore: loadBalancerImpact.reliabilityScore || 0,
      },
      firewall: {
        totalRules: firewallImpact.totalRules || 0,
        activeRules: firewallImpact.activeRules || 0,
        securityScore: firewallImpact.securityScore || 0,
        availabilityImpact: firewallImpact.availabilityImpact || 0,
        performanceImpact: firewallImpact.performanceImpact || 0,
      },
      loadBalancer: {
        totalLoadBalancers: loadBalancerImpact.totalLoadBalancers || 0,
        activeLoadBalancers: loadBalancerImpact.activeLoadBalancers || 0,
        reliabilityScore: loadBalancerImpact.reliabilityScore || 0,
        availabilityImprovement: loadBalancerImpact.availabilityImprovement || 0,
        performanceScore: loadBalancerImpact.performanceScore || 0,
        latencyReduction: loadBalancerImpact.latencyReduction || 0,
        throughputIncrease: loadBalancerImpact.throughputIncrease || 0,
      },
      incidents: {
        recent: activeIncidents.slice(0, 10),
        byType: this.groupIncidentsByType(activeIncidents),
        bySeverity: this.groupIncidentsBySeverity(activeIncidents),
      },
    };
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get security recommendations' })
  @ApiQuery({ name: 'datacenterId', required: false, description: 'Filter by datacenter ID' })
  @ApiResponse({ status: 200, description: 'Security recommendations retrieved successfully' })
  async getSecurityRecommendations(
    @Request() req: any,
    @Query('datacenterId') datacenterId?: number,
  ) {
    const userId = req.user.userId;
    const recommendations = [];

    try {
      const firewallImpact = await this.firewallRuleService.calculateSecurityImpact(userId, datacenterId);
      const loadBalancerImpact = await this.loadBalancerService.calculateLoadBalancerImpact(userId, datacenterId);
      
      if (firewallImpact.securityScore < 50) {
        recommendations.push({
          type: 'FIREWALL',
          priority: 'HIGH',
          title: 'Improve Firewall Security',
          description: 'Your firewall security score is below 50%. Consider adding more comprehensive rules.',
          action: 'Add firewall rules for critical services and ports',
          impact: 'High security improvement',
        });
      }

      if (firewallImpact.activeRules < 5) {
        recommendations.push({
          type: 'FIREWALL',
          priority: 'MEDIUM',
          title: 'Add More Firewall Rules',
          description: 'You have fewer than 5 active firewall rules. Consider adding more for better protection.',
          action: 'Create additional firewall rules for different protocols and services',
          impact: 'Medium security improvement',
        });
      }

      if (loadBalancerImpact.activeLoadBalancers === 0) {
        recommendations.push({
          type: 'LOAD_BALANCER',
          priority: 'HIGH',
          title: 'Implement Load Balancing',
          description: 'No active load balancers detected. Load balancing improves availability and performance.',
          action: 'Create load balancers for critical services',
          impact: 'High availability and performance improvement',
        });
      }

      if (loadBalancerImpact.reliabilityScore < 70) {
        recommendations.push({
          type: 'LOAD_BALANCER',
          priority: 'MEDIUM',
          title: 'Improve Load Balancer Configuration',
          description: 'Load balancer reliability score is below 70%. Review configuration and health checks.',
          action: 'Optimize load balancer settings and add health checks',
          impact: 'Medium reliability improvement',
        });
      }

      const incidents = this.securityTickIntegrationService.getSecurityIncidents(userId);
      const criticalIncidents = incidents.filter(i => !i.resolved && i.severity === 'CRITICAL');
      
      if (criticalIncidents.length > 0) {
        recommendations.push({
          type: 'INCIDENT',
          priority: 'CRITICAL',
          title: 'Resolve Critical Security Incidents',
          description: `You have ${criticalIncidents.length} unresolved critical security incidents.`,
          action: 'Review and resolve critical security incidents immediately',
          impact: 'Critical security risk mitigation',
        });
      }

      return {
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          criticalCount: recommendations.filter(r => r.priority === 'CRITICAL').length,
          highCount: recommendations.filter(r => r.priority === 'HIGH').length,
          mediumCount: recommendations.filter(r => r.priority === 'MEDIUM').length,
        },
      };
    } catch (error) {
      return {
        recommendations: [],
        error: 'Failed to generate recommendations',
        message: error.message,
      };
    }
  }

  private groupIncidentsByType(incidents: any[]) {
    const grouped = incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([type, count]) => ({ type, count }));
  }

  private groupIncidentsBySeverity(incidents: any[]) {
    const grouped = incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([severity, count]) => ({ severity, count }));
  }
}