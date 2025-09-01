import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max, Length } from 'class-validator';
import { DatacenterStatus } from '../Models/Datacenter';

export class CreateDatacenterDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  maxRacks: number;

  @IsNumber()
  @Min(0)
  powerCapacityKW: number;

  @IsNumber()
  @Min(0)
  coolingCapacityKW: number;

  @IsOptional()
  @IsEnum(DatacenterStatus)
  status?: DatacenterStatus;
}

export class UpdateDatacenterDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxRacks?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  powerCapacityKW?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coolingCapacityKW?: number;

  @IsOptional()
  @IsEnum(DatacenterStatus)
  status?: DatacenterStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPowerUsageKW?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentCoolingUsageKW?: number;
}

export class DatacenterResponseDto {
  id: string;
  name: string;
  location: string;
  description?: string;
  maxRacks: number;
  powerCapacityKW: number;
  coolingCapacityKW: number;
  status: DatacenterStatus;
  currentPowerUsageKW: number;
  currentCoolingUsageKW: number;
  powerUtilization: number;
  coolingUtilization: number;
  rackUtilization: number;
  createdAt: Date;
  updatedAt: Date;
}