import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ContractStatus } from '../../../Enums/ServiceEnum';

export class UpdateContractRequest {
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    monthlyPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    setupFee?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    securityDeposit?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(31)
    billingDay?: number;

    @IsOptional()
    @IsBoolean()
    autoPayment?: boolean;

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
    @IsNumber()
    @Min(1)
    maxIncidentResolutionHours?: number;

    @IsOptional()
    slaPenalties?: any;

    @IsOptional()
    contractTerms?: any;
}