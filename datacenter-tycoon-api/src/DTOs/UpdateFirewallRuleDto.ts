import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsObject, ValidateNested, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  FirewallAction,
  FirewallProtocol,
  FirewallDirection,
  FirewallRuleStatus
} from '../Models/Enums/NetworkEnum';

export class UpdateFirewallRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FirewallAction)
  action?: FirewallAction;

  @IsOptional()
  @IsEnum(FirewallProtocol)
  protocol?: FirewallProtocol;

  @IsOptional()
  @IsEnum(FirewallDirection)
  direction?: FirewallDirection;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  sourceIp?: string;

  @IsOptional()
  @IsString()
  sourceNetmask?: string;

  @IsOptional()
  @IsString()
  sourceCidr?: string;

  @IsOptional()
  @IsNumber()
  sourcePort?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceIpList?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  sourcePortList?: number[];

  @IsOptional()
  @IsString()
  sourceZone?: string;

  @IsOptional()
  @IsString()
  sourceInterface?: string;

  @IsOptional()
  @IsString()
  sourceGroup?: string;

  @IsOptional()
  @IsString()
  destinationIp?: string;

  @IsOptional()
  @IsString()
  destinationNetmask?: string;

  @IsOptional()
  @IsString()
  destinationCidr?: string;

  @IsOptional()
  @IsNumber()
  destinationPort?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinationIpList?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  destinationPortList?: number[];

  @IsOptional()
  @IsString()
  destinationZone?: string;

  @IsOptional()
  @IsString()
  destinationInterface?: string;

  @IsOptional()
  @IsString()
  destinationGroup?: string;

  @IsOptional()
  @IsObject()
  natConfig?: {
    enabled: boolean;
    sourceNat?: boolean;
    destinationNat?: boolean;
    natIp?: string;
    natPort?: number;
  };

  @IsOptional()
  @IsObject()
  loggingConfig?: {
    enabled: boolean;
    level?: string;
    facility?: string;
  };

  @IsOptional()
  @IsObject()
  rateLimitConfig?: {
    enabled: boolean;
    maxConnections?: number;
    maxConnectionsPerSecond?: number;
    burstSize?: number;
  };

  @IsOptional()
  @IsObject()
  timeConfig?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    days?: string[];
    timezone?: string;
  };

  @IsOptional()
  @IsObject()
  geoConfig?: {
    enabled: boolean;
    allowedCountries?: string[];
    blockedCountries?: string[];
    allowedRegions?: string[];
    blockedRegions?: string[];
  };

  @IsOptional()
  @IsObject()
  dpiConfig?: {
    enabled: boolean;
    inspectApplications?: boolean;
    blockedApplications?: string[];
    allowedApplications?: string[];
    inspectContent?: boolean;
    contentFilters?: string[];
  };

  @IsOptional()
  @IsObject()
  connectionConfig?: {
    maxConnections?: number;
    connectionTimeout?: number;
    idleTimeout?: number;
    keepAlive?: boolean;
  };

  @IsOptional()
  @IsObject()
  alertConfig?: {
    enabled: boolean;
    thresholds?: {
      connectionsPerSecond?: number;
      bytesPerSecond?: number;
      packetsPerSecond?: number;
    };
    notifications?: {
      email?: boolean;
      sms?: boolean;
      webhook?: boolean;
    };
  };

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  changeReason?: string;
}