import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ServiceStatus } from '../../../Enums/ServiceEnum';

export class CreateServiceRequest {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsNumber()
    serviceTypeId: number;

    @IsNotEmpty()
    @IsNumber()
    datacenterId: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ServiceStatus)
    status?: ServiceStatus;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    allocatedCpuCores: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    allocatedRamGb: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    allocatedStorageGb: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    allocatedBandwidthMbps: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    monthlyPrice: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    setupPrice?: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(90)
    @Max(100)
    guaranteedUptimePercent: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    maxLatencyMs: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    minThroughputMbps: number;

    @IsOptional()
    serviceConfiguration?: any;

    @IsOptional()
    @IsBoolean()
    isAvailableForContracts?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxConcurrentContracts?: number;
}