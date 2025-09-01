import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsObject, ValidateNested, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  LoadBalancerType,
  LoadBalancerAlgorithm,
  HealthCheckProtocol
} from '../Models/Enums/NetworkEnum';

export class CreateLoadBalancerDto {
  @IsNumber()
  datacenterId: number;

  @IsOptional()
  @IsNumber()
  deviceId?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(LoadBalancerType)
  type: LoadBalancerType;

  @IsEnum(LoadBalancerAlgorithm)
  algorithm: LoadBalancerAlgorithm;

  @IsOptional()
  @IsString()
  virtualIp?: string;

  @IsOptional()
  @IsNumber()
  virtualPort?: number;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  backendServers?: {
    ip: string;
    port: number;
    weight?: number;
    healthy?: boolean;
    maxConnections?: number;
  }[];

  @IsOptional()
  @IsObject()
  healthCheckConfig?: {
    enabled: boolean;
    protocol?: HealthCheckProtocol;
    path?: string;
    interval?: number;
    timeout?: number;
    retries?: number;
    successCodes?: number[];
  };

  @IsOptional()
  @IsObject()
  sessionPersistence?: {
    enabled: boolean;
    type?: string;
    cookieName?: string;
    timeout?: number;
  };

  @IsOptional()
  @IsObject()
  sslConfig?: {
    enabled: boolean;
    certificateId?: string;
    protocols?: string[];
    ciphers?: string[];
    sslOffloading?: boolean;
  };

  @IsOptional()
  @IsObject()
  compressionConfig?: {
    enabled: boolean;
    types?: string[];
    level?: number;
  };

  @IsOptional()
  @IsObject()
  cachingConfig?: {
    enabled: boolean;
    ttl?: number;
    maxSize?: number;
    rules?: {
      path: string;
      ttl: number;
    }[];
  };

  @IsOptional()
  @IsObject()
  rateLimitConfig?: {
    enabled: boolean;
    requestsPerSecond?: number;
    burstSize?: number;
    clientIdentification?: string;
  };

  @IsOptional()
  @IsObject()
  failoverConfig?: {
    enabled: boolean;
    healthyThreshold?: number;
    unhealthyThreshold?: number;
    failoverTime?: number;
    backupServers?: {
      ip: string;
      port: number;
      weight?: number;
    }[];
  };

  @IsOptional()
  @IsObject()
  monitoringConfig?: {
    enabled: boolean;
    metricsInterval?: number;
    alertThresholds?: {
      responseTime?: number;
      errorRate?: number;
      connectionCount?: number;
    };
  };

  @IsOptional()
  @IsObject()
  loggingConfig?: {
    enabled: boolean;
    level?: string;
    format?: string;
    destination?: string;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}