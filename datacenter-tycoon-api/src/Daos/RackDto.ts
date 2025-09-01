import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max, Length } from 'class-validator';
import { RackStatus } from '../Models/Rack';

export class CreateRackDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  rackUnits: number;

  @IsNumber()
  @Min(0)
  maxPowerKW: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  datacenterId: string;

  @IsOptional()
  @IsEnum(RackStatus)
  status?: RackStatus;
}

export class UpdateRackDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  rackUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPowerKW?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPowerKW?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RackStatus)
  status?: RackStatus;
}

export class RackResponseDto {
  id: string;
  name: string;
  rackUnits: number;
  usedUnits: number;
  availableUnits: number;
  maxPowerKW: number;
  currentPowerKW: number;
  powerUtilization: number;
  utilizationPercentage: number;
  status: RackStatus;
  location?: string;
  description?: string;
  datacenterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RackWithDevicesDto extends RackResponseDto {
  devices: any[];
}