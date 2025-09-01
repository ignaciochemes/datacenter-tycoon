import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../Models/Entities/ServiceEntity';
import { CreateServiceRequest } from '../Models/Request/ServiceController/CreateServiceRequest';
import { UpdateServiceRequest } from '../Models/Request/ServiceController/UpdateServiceRequest';
import { ServiceStatus } from '../Enums/ServiceEnum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ServiceService {
    constructor(
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>
    ) {}

    async createService(request: CreateServiceRequest): Promise<number> {
        const service = new Service();
        service.uuid = uuidv4();
        service.userId = { id: request.userId } as any;
        service.serviceTypeId = { id: request.serviceTypeId } as any;
        service.datacenterId = { id: request.datacenterId } as any;
        service.name = request.name;
        service.description = request.description;
        service.status = request.status || ServiceStatus.INACTIVE;
        service.allocatedCpuCores = request.allocatedCpuCores;
        service.allocatedRamGb = request.allocatedRamGb;
        service.allocatedStorageGb = request.allocatedStorageGb;
        service.allocatedBandwidthMbps = request.allocatedBandwidthMbps;
        service.monthlyPrice = request.monthlyPrice;
        service.setupPrice = request.setupPrice || 0;
        service.guaranteedUptimePercent = request.guaranteedUptimePercent;
        service.maxLatencyMs = request.maxLatencyMs;
        service.minThroughputMbps = request.minThroughputMbps;
        service.serviceConfiguration = request.serviceConfiguration;
        service.isAvailableForContracts = request.isAvailableForContracts ?? true;
        service.maxConcurrentContracts = request.maxConcurrentContracts;
        service.currentActiveContracts = 0;
        service.createdAt = new Date();
        service.updatedAt = new Date();

        const savedService = await this.serviceRepository.save(service);
        return savedService.id;
    }

    async getServicesByUser(userId: number): Promise<Service[]> {
        return await this.serviceRepository.find({
            where: { userId: { id: userId } },
            relations: ['userId', 'serviceTypeId', 'datacenterId']
        });
    }

    async getServiceById(id: number): Promise<Service> {
        const service = await this.serviceRepository.findOne({
            where: { id },
            relations: ['userId', 'serviceTypeId', 'datacenterId']
        });

        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`);
        }

        return service;
    }

    async updateService(id: number, request: UpdateServiceRequest): Promise<void> {
        const service = await this.getServiceById(id);

        if (request.name !== undefined) service.name = request.name;
        if (request.description !== undefined) service.description = request.description;
        if (request.status !== undefined) service.status = request.status;
        if (request.allocatedCpuCores !== undefined) service.allocatedCpuCores = request.allocatedCpuCores;
        if (request.allocatedRamGb !== undefined) service.allocatedRamGb = request.allocatedRamGb;
        if (request.allocatedStorageGb !== undefined) service.allocatedStorageGb = request.allocatedStorageGb;
        if (request.allocatedBandwidthMbps !== undefined) service.allocatedBandwidthMbps = request.allocatedBandwidthMbps;
        if (request.monthlyPrice !== undefined) service.monthlyPrice = request.monthlyPrice;
        if (request.setupPrice !== undefined) service.setupPrice = request.setupPrice;
        if (request.guaranteedUptimePercent !== undefined) service.guaranteedUptimePercent = request.guaranteedUptimePercent;
        if (request.maxLatencyMs !== undefined) service.maxLatencyMs = request.maxLatencyMs;
        if (request.minThroughputMbps !== undefined) service.minThroughputMbps = request.minThroughputMbps;
        if (request.serviceConfiguration !== undefined) service.serviceConfiguration = request.serviceConfiguration;
        if (request.isAvailableForContracts !== undefined) service.isAvailableForContracts = request.isAvailableForContracts;
        if (request.maxConcurrentContracts !== undefined) service.maxConcurrentContracts = request.maxConcurrentContracts;

        service.updatedAt = new Date();
        await this.serviceRepository.save(service);
    }

    async deleteService(id: number): Promise<void> {
        const service = await this.getServiceById(id);
        
        if (service.currentActiveContracts > 0) {
            throw new BadRequestException('Cannot delete service with active contracts');
        }

        await this.serviceRepository.remove(service);
    }

    async activateService(id: number): Promise<void> {
        const service = await this.getServiceById(id);
        service.status = ServiceStatus.ACTIVE;
        service.activationDate = new Date();
        service.updatedAt = new Date();
        await this.serviceRepository.save(service);
    }

    async suspendService(id: number): Promise<void> {
        const service = await this.getServiceById(id);
        service.status = ServiceStatus.SUSPENDED;
        service.suspensionDate = new Date();
        service.updatedAt = new Date();
        await this.serviceRepository.save(service);
    }

    async getServiceMetrics(id: number): Promise<any> {
        const service = await this.getServiceById(id);
        
        return {
            serviceId: service.id,
            name: service.name,
            status: service.status,
            currentMetrics: {
                uptimePercent: service.currentUptimePercent,
                avgLatencyMs: service.currentAvgLatencyMs,
                avgThroughputMbps: service.currentAvgThroughputMbps,
                cpuUsagePercent: service.currentCpuUsagePercent,
                ramUsagePercent: service.currentRamUsagePercent,
                storageUsagePercent: service.currentStorageUsagePercent
            },
            guarantees: {
                uptimePercent: service.guaranteedUptimePercent,
                maxLatencyMs: service.maxLatencyMs,
                minThroughputMbps: service.minThroughputMbps
            },
            contracts: {
                active: service.currentActiveContracts,
                maximum: service.maxConcurrentContracts
            },
            pricing: {
                monthly: service.monthlyPrice,
                setup: service.setupPrice
            }
        };
    }

    async updateServiceMetrics(id: number, metrics: any): Promise<void> {
        const service = await this.getServiceById(id);
        
        service.currentUptimePercent = metrics.uptimePercent;
        service.currentAvgLatencyMs = metrics.avgLatencyMs;
        service.currentAvgThroughputMbps = metrics.avgThroughputMbps;
        service.currentCpuUsagePercent = metrics.cpuUsagePercent;
        service.currentRamUsagePercent = metrics.ramUsagePercent;
        service.currentStorageUsagePercent = metrics.storageUsagePercent;
        service.updatedAt = new Date();
        
        await this.serviceRepository.save(service);
    }
}