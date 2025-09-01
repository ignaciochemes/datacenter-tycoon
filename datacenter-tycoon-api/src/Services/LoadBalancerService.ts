import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadBalancerEntity } from '../Models/Entities/LoadBalancerEntity';
import { CreateLoadBalancerDto } from '../DTOs/CreateLoadBalancerDto';
import { UpdateLoadBalancerDto } from '../DTOs/UpdateLoadBalancerDto';
import { LoadBalancerStatus, LoadBalancerAlgorithm, HealthCheckProtocol } from '../Models/Enums/NetworkEnum';

@Injectable()
export class LoadBalancerService {
  constructor(
    @InjectRepository(LoadBalancerEntity)
    private readonly loadBalancerRepository: Repository<LoadBalancerEntity>,
  ) {}

  async create(createLoadBalancerDto: CreateLoadBalancerDto, userId: number): Promise<LoadBalancerEntity> {
    const loadBalancer = this.loadBalancerRepository.create({
      ...createLoadBalancerDto,
      userId,
      status: LoadBalancerStatus.INACTIVE,
      enabled: false,
      createdAt: new Date(),
      lastModified: new Date(),
      createdBy: userId.toString(),
      lastModifiedBy: userId.toString(),
    });

    return await this.loadBalancerRepository.save(loadBalancer);
  }

  async findAll(userId: number): Promise<LoadBalancerEntity[]> {
    return await this.loadBalancerRepository.find({
      where: { userId },
      relations: ['datacenter', 'device'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDatacenter(userId: number, datacenterId: number): Promise<LoadBalancerEntity[]> {
    return await this.loadBalancerRepository.find({
      where: { userId, datacenterId },
      relations: ['datacenter', 'device'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDevice(userId: number, deviceId: number): Promise<LoadBalancerEntity[]> {
    return await this.loadBalancerRepository.find({
      where: { userId, deviceId },
      relations: ['datacenter', 'device'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<LoadBalancerEntity> {
    const loadBalancer = await this.loadBalancerRepository.findOne({
      where: { id, userId },
      relations: ['datacenter', 'device'],
    });

    if (!loadBalancer) {
      throw new Error('Load balancer not found');
    }

    return loadBalancer;
  }

  async update(id: number, updateLoadBalancerDto: UpdateLoadBalancerDto, userId: number): Promise<LoadBalancerEntity> {
    const loadBalancer = await this.findOne(id, userId);
    
    Object.assign(loadBalancer, {
      ...updateLoadBalancerDto,
      lastModified: new Date(),
      lastModifiedBy: userId.toString(),
    });

    return await this.loadBalancerRepository.save(loadBalancer);
  }

  async remove(id: number, userId: number): Promise<void> {
    const loadBalancer = await this.findOne(id, userId);
    await this.loadBalancerRepository.remove(loadBalancer);
  }

  async activate(id: number, userId: number): Promise<LoadBalancerEntity> {
    const loadBalancer = await this.findOne(id, userId);
    
    loadBalancer.status = LoadBalancerStatus.ACTIVE;
    loadBalancer.enabled = true;
    loadBalancer.activatedAt = new Date();
    loadBalancer.lastModified = new Date();
    loadBalancer.lastModifiedBy = userId.toString();

    return await this.loadBalancerRepository.save(loadBalancer);
  }

  async deactivate(id: number, userId: number): Promise<LoadBalancerEntity> {
    const loadBalancer = await this.findOne(id, userId);
    
    loadBalancer.status = LoadBalancerStatus.INACTIVE;
    loadBalancer.enabled = false;
    loadBalancer.deactivatedAt = new Date();
    loadBalancer.lastModified = new Date();
    loadBalancer.lastModifiedBy = userId.toString();

    return await this.loadBalancerRepository.save(loadBalancer);
  }

  async getActiveLoadBalancers(userId: number, datacenterId?: number): Promise<LoadBalancerEntity[]> {
    const whereCondition: any = {
      userId,
      status: LoadBalancerStatus.ACTIVE,
      enabled: true,
    };

    if (datacenterId) {
      whereCondition.datacenterId = datacenterId;
    }

    return await this.loadBalancerRepository.find({
      where: whereCondition,
      relations: ['datacenter', 'device'],
      order: { createdAt: 'DESC' },
    });
  }

  async calculateLoadBalancerImpact(userId: number, datacenterId: number): Promise<{
    totalLoadBalancers: number;
    activeLoadBalancers: number;
    availabilityImprovement: number;
    latencyReduction: number;
    throughputIncrease: number;
    redundancyScore: number;
  }> {
    const allLoadBalancers = await this.findByDatacenter(userId, datacenterId);
    const activeLoadBalancers = allLoadBalancers.filter(lb => lb.status === LoadBalancerStatus.ACTIVE && lb.enabled);
    
    const availabilityImprovement = this.calculateAvailabilityImprovement(activeLoadBalancers);
    const latencyReduction = this.calculateLatencyReduction(activeLoadBalancers);
    const throughputIncrease = this.calculateThroughputIncrease(activeLoadBalancers);
    const redundancyScore = this.calculateRedundancyScore(activeLoadBalancers);

    return {
      totalLoadBalancers: allLoadBalancers.length,
      activeLoadBalancers: activeLoadBalancers.length,
      availabilityImprovement,
      latencyReduction,
      throughputIncrease,
      redundancyScore,
    };
  }

  private calculateAvailabilityImprovement(loadBalancers: LoadBalancerEntity[]): number {
    if (loadBalancers.length === 0) return 0;
    
    let improvement = 0;
    
    loadBalancers.forEach(lb => {
      const backendCount = lb.backendServers?.length || 1;
      const healthyBackends = lb.backendServers?.filter(server => server.healthy)?.length || 1;
      
      const redundancyFactor = Math.min(backendCount / 2, 3);
      const healthRatio = healthyBackends / backendCount;
      
      improvement += (redundancyFactor * healthRatio * 15);
      
      if (lb.healthCheckConfig?.enabled) {
        improvement += 5;
      }
      
      if (lb.failoverConfig?.enabled) {
        improvement += 10;
      }
    });
    
    return Math.min(100, Math.round(improvement));
  }

  private calculateLatencyReduction(loadBalancers: LoadBalancerEntity[]): number {
    if (loadBalancers.length === 0) return 0;
    
    let reduction = 0;
    
    loadBalancers.forEach(lb => {
      switch (lb.algorithm) {
        case LoadBalancerAlgorithm.LEAST_CONNECTIONS:
          reduction += 25;
          break;
        case LoadBalancerAlgorithm.LEAST_RESPONSE_TIME:
          reduction += 30;
          break;
        case LoadBalancerAlgorithm.WEIGHTED_ROUND_ROBIN:
          reduction += 20;
          break;
        case LoadBalancerAlgorithm.ROUND_ROBIN:
          reduction += 15;
          break;
        case LoadBalancerAlgorithm.IP_HASH:
          reduction += 10;
          break;
        default:
          reduction += 5;
      }
      
      if (lb.sslConfig?.enabled) {
        reduction -= 5;
      }
      
      if (lb.compressionConfig?.enabled) {
        reduction += 8;
      }
    });
    
    return Math.min(100, Math.max(0, Math.round(reduction / loadBalancers.length)));
  }

  private calculateThroughputIncrease(loadBalancers: LoadBalancerEntity[]): number {
    if (loadBalancers.length === 0) return 0;
    
    let increase = 0;
    
    loadBalancers.forEach(lb => {
      const backendCount = lb.backendServers?.length || 1;
      const healthyBackends = lb.backendServers?.filter(server => server.healthy)?.length || 1;
      
      increase += (healthyBackends * 20);
      
      if (lb.sessionPersistence?.enabled) {
        increase -= 5;
      }
      
      if (lb.cachingConfig?.enabled) {
        increase += 15;
      }
      
      if (lb.compressionConfig?.enabled) {
        increase += 10;
      }
    });
    
    return Math.min(200, Math.round(increase));
  }

  private calculateRedundancyScore(loadBalancers: LoadBalancerEntity[]): number {
    if (loadBalancers.length === 0) return 0;
    
    let score = 0;
    
    loadBalancers.forEach(lb => {
      const backendCount = lb.backendServers?.length || 1;
      const healthyBackends = lb.backendServers?.filter(server => server.healthy)?.length || 1;
      
      if (backendCount >= 3) {
        score += 30;
      } else if (backendCount >= 2) {
        score += 20;
      } else {
        score += 5;
      }
      
      const healthRatio = healthyBackends / backendCount;
      score += (healthRatio * 20);
      
      if (lb.failoverConfig?.enabled) {
        score += 15;
      }
      
      if (lb.healthCheckConfig?.enabled) {
        score += 10;
      }
    });
    
    return Math.min(100, Math.round(score / loadBalancers.length));
  }

  async updateLoadBalancerMetrics(loadBalancerId: number, requestsProcessed: number, bytesTransferred: number, responseTime: number): Promise<void> {
    const loadBalancer = await this.loadBalancerRepository.findOne({ where: { id: loadBalancerId } });
    
    if (loadBalancer) {
      loadBalancer.requestsProcessed = (loadBalancer.requestsProcessed || 0) + requestsProcessed;
      loadBalancer.bytesTransferred = (loadBalancer.bytesTransferred || 0) + bytesTransferred;
      
      const currentAvgResponseTime = loadBalancer.averageResponseTime || 0;
      const totalRequests = loadBalancer.requestsProcessed || 1;
      loadBalancer.averageResponseTime = ((currentAvgResponseTime * (totalRequests - requestsProcessed)) + (responseTime * requestsProcessed)) / totalRequests;
      
      loadBalancer.lastActivity = new Date();
      
      await this.loadBalancerRepository.save(loadBalancer);
    }
  }

  async performHealthCheck(loadBalancerId: number): Promise<{
    healthy: boolean;
    healthyBackends: number;
    totalBackends: number;
    issues: string[];
  }> {
    const loadBalancer = await this.loadBalancerRepository.findOne({ where: { id: loadBalancerId } });
    
    if (!loadBalancer) {
      return {
        healthy: false,
        healthyBackends: 0,
        totalBackends: 0,
        issues: ['Load balancer not found'],
      };
    }
    
    const issues: string[] = [];
    const totalBackends = loadBalancer.backendServers?.length || 0;
    let healthyBackends = 0;
    
    if (totalBackends === 0) {
      issues.push('No backend servers configured');
    } else {
      healthyBackends = loadBalancer.backendServers?.filter(server => server.healthy)?.length || 0;
      
      if (healthyBackends === 0) {
        issues.push('No healthy backend servers available');
      } else if (healthyBackends < totalBackends * 0.5) {
        issues.push('Less than 50% of backend servers are healthy');
      }
    }
    
    if (!loadBalancer.enabled) {
      issues.push('Load balancer is disabled');
    }
    
    if (loadBalancer.status !== LoadBalancerStatus.ACTIVE) {
      issues.push('Load balancer is not active');
    }
    
    const healthy = issues.length === 0 && healthyBackends > 0;
    
    return {
      healthy,
      healthyBackends,
      totalBackends,
      issues,
    };
  }
}