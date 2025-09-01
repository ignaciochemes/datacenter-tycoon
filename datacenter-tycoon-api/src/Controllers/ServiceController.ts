import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ServiceService } from '../Services/ServiceService';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';
import { CreateServiceRequest } from '../Models/Request/ServiceController/CreateServiceRequest';
import { UpdateServiceRequest } from '../Models/Request/ServiceController/UpdateServiceRequest';
import { IdResponse } from '../Models/Response/IdResponse';
import { GetServicesResponse } from '../Models/Response/ServiceController/GetServicesResponse';
import { GetServiceResponse } from '../Models/Response/ServiceController/GetServiceResponse';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServiceController {
    constructor(private readonly serviceService: ServiceService) {}

    @Post()
    async createService(@Body() request: CreateServiceRequest): Promise<IdResponse> {
        const serviceId = await this.serviceService.createService(request);
        return new IdResponse(serviceId);
    }

    @Get('user/:userId')
    async getServicesByUser(@Param('userId') userId: number): Promise<GetServicesResponse> {
        const services = await this.serviceService.getServicesByUser(userId);
        return new GetServicesResponse(services);
    }

    @Get(':id')
    async getServiceById(@Param('id') id: number): Promise<GetServiceResponse> {
        const service = await this.serviceService.getServiceById(id);
        return new GetServiceResponse(service);
    }

    @Put(':id')
    async updateService(
        @Param('id') id: number,
        @Body() request: UpdateServiceRequest
    ): Promise<IdResponse> {
        await this.serviceService.updateService(id, request);
        return new IdResponse(id);
    }

    @Delete(':id')
    async deleteService(@Param('id') id: number): Promise<IdResponse> {
        await this.serviceService.deleteService(id);
        return new IdResponse(id);
    }

    @Put(':id/activate')
    async activateService(@Param('id') id: number): Promise<IdResponse> {
        await this.serviceService.activateService(id);
        return new IdResponse(id);
    }

    @Put(':id/suspend')
    async suspendService(@Param('id') id: number): Promise<IdResponse> {
        await this.serviceService.suspendService(id);
        return new IdResponse(id);
    }

    @Get(':id/metrics')
    async getServiceMetrics(@Param('id') id: number) {
        return await this.serviceService.getServiceMetrics(id);
    }
}