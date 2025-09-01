import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ServiceStatus } from '../../../Enums/ServiceEnum';

export class UpdateServiceRequest {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ServiceStatus)
    status?: ServiceStatus;

    @IsOptional()
    @IsNumber()
    @Min(1)
    allocatedCpuCores?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    allocatedRamGb?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    allocatedStorageGb?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    allocatedBandwidthMbps?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    monthlyPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    setupPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(90)
    @Max(100)
    guaranteedUptimePercent?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxLatencyMs?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    minThroughputMbps?: number;

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