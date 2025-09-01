import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ContractService } from '../Services/ContractService';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';
import { CreateContractRequest } from '../Models/Request/ContractController/CreateContractRequest';
import { UpdateContractRequest } from '../Models/Request/ContractController/UpdateContractRequest';
import { IdResponse } from '../Models/Response/IdResponse';
import { GetContractsResponse } from '../Models/Response/ContractController/GetContractsResponse';
import { GetContractResponse } from '../Models/Response/ContractController/GetContractResponse';
import { GetContractMetricsResponse } from '../Models/Response/ContractController/GetContractMetricsResponse';
import { GetContractStatsResponse } from '../Models/Response/ContractController/GetContractStatsResponse';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
    constructor(private readonly contractService: ContractService) {}

    @Post()
    async createContract(@Body() request: CreateContractRequest): Promise<IdResponse> {
        const contractId = await this.contractService.createContract(request);
        return new IdResponse(contractId);
    }

    @Get('user/:userId')
    async getContractsByUser(@Param('userId') userId: number): Promise<GetContractsResponse> {
        const contracts = await this.contractService.getContractsByUser(userId);
        return new GetContractsResponse(contracts);
    }

    @Get('provider/:providerId')
    async getContractsByProvider(@Param('providerId') providerId: number): Promise<GetContractsResponse> {
        const contracts = await this.contractService.getContractsByProvider(providerId);
        return new GetContractsResponse(contracts);
    }

    @Get('client/:clientId')
    async getContractsByClient(@Param('clientId') clientId: number): Promise<GetContractsResponse> {
        const contracts = await this.contractService.getContractsByClient(clientId);
        return new GetContractsResponse(contracts);
    }

    @Get(':id')
    async getContractById(@Param('id') id: number): Promise<GetContractResponse> {
        const contract = await this.contractService.getContractById(id);
        return new GetContractResponse(contract);
    }

    @Put(':id')
    async updateContract(
        @Param('id') id: number,
        @Body() request: UpdateContractRequest
    ): Promise<IdResponse> {
        await this.contractService.updateContract(id, request);
        return new IdResponse(id);
    }

    @Delete(':id')
    async deleteContract(@Param('id') id: number): Promise<IdResponse> {
        await this.contractService.deleteContract(id);
        return new IdResponse(id);
    }

    @Put(':id/activate')
    async activateContract(@Param('id') id: number): Promise<IdResponse> {
        await this.contractService.activateContract(id);
        return new IdResponse(id);
    }

    @Put(':id/suspend')
    async suspendContract(@Param('id') id: number): Promise<IdResponse> {
        await this.contractService.suspendContract(id);
        return new IdResponse(id);
    }

    @Put(':id/terminate')
    async terminateContract(@Param('id') id: number): Promise<IdResponse> {
        await this.contractService.terminateContract(id);
        return new IdResponse(id);
    }

    @Get(':id/metrics')
    async getContractMetrics(@Param('id') id: number): Promise<GetContractMetricsResponse> {
        const metrics = await this.contractService.getContractMetrics(id);
        return new GetContractMetricsResponse(metrics);
    }

    @Get(':id/sla-status')
    async getSLAStatus(@Param('id') id: number) {
        return await this.contractService.getSLAStatus(id);
    }

    @Post(':id/apply-penalties')
    async applyPenalties(@Param('id') id: number) {
        return await this.contractService.applyPenalties(id);
    }

    @Get('stats')
    async getContractStats(): Promise<GetContractStatsResponse> {
        const stats = await this.contractService.getContractStats();
        return new GetContractStatsResponse(
            stats.totalContracts,
            stats.activeContracts,
            stats.monthlyRevenue,
            stats.totalPenalties,
            stats.averageUptime
        );
    }
}