import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsUUID, IsDateString, IsIP, Min, Max, Length, Matches } from 'class-validator';
import { DeviceType, DeviceStatus } from '../Models/Device';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  model: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  manufacturer: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  serialNumber?: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  rackUnits: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  startUnit: number;

  @IsNumber()
  @Min(0)
  powerConsumptionKW: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heatOutputKW?: number;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'MAC address must be in format XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX'
  })
  macAddress?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsUUID()
  rackId: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  type?: DeviceType;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  model?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  serialNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rackUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  startUnit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  powerConsumptionKW?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heatOutputKW?: number;

  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'MAC address must be in format XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX'
  })
  macAddress?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;
}

export class DeviceResponseDto {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  manufacturer: string;
  serialNumber?: string;
  rackUnits: number;
  startUnit: number;
  endUnit: number;
  powerConsumptionKW: number;
  heatOutputKW?: number;
  status: DeviceStatus;
  ipAddress?: string;
  macAddress?: string;
  description?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  isWarrantyValid: boolean;
  ageInDays: number;
  rackId: string;
  createdAt: Date;
  updatedAt: Date;
}