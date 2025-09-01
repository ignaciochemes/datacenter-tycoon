import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ContractStatus } from '../../../Enums/ServiceEnum';

export class CreateContractRequest {
    @IsNotEmpty()
    @IsNumber()
    providerId: number;

    @IsNotEmpty()
    @IsNumber()
    clientId: number;

    @IsNotEmpty()
    @IsNumber()
    serviceId: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus;

    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    monthlyPrice: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    setupFee?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    securityDeposit?: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(31)
    billingDay: number;

    @IsOptional()
    @IsBoolean()
    autoPayment?: boolean;

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
    @IsNumber()
    @Min(1)
    maxIncidentResolutionHours?: number;

    @IsOptional()
    slaPenalties?: any;

    @IsOptional()
    contractTerms?: any;
}