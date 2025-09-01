import { LoadBalancerType, LoadBalancerAlgorithm, LoadBalancerStatus, HealthCheckProtocol } from '../Models/Enums/NetworkEnum';

export interface BackendServerDto {
  id: string;
  ipAddress: string;
  port: number;
  weight: number;
  priority: number;
  maxConnections: number;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
  lastHealthCheck: Date;
  enabled: boolean;
}

export interface HealthCheckConfigDto {
  protocol: HealthCheckProtocol;
  port: number;
  path?: string;
  interval: number;
  timeout: number;
  retries: number;
  successThreshold: number;
  failureThreshold: number;
  expectedResponse?: string;
  headers?: Record<string, string>;
}

export interface SessionPersistenceDto {
  enabled: boolean;
  method: 'cookie' | 'ip_hash' | 'source_ip';
  cookieName?: string;
  timeout: number;
}

export interface SslConfigDto {
  enabled: boolean;
  certificateId?: string;
  protocols: string[];
  ciphers: string[];
  sslOffloading: boolean;
  redirectHttpToHttps: boolean;
}

export interface CompressionConfigDto {
  enabled: boolean;
  types: string[];
  level: number;
  minSize: number;
}

export interface CachingConfigDto {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  cacheRules: Array<{
    pattern: string;
    ttl: number;
    enabled: boolean;
  }>;
}

export interface RateLimitConfigDto {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  windowSize: number;
  action: 'drop' | 'queue' | 'reject';
}

export interface FailoverConfigDto {
  enabled: boolean;
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
  autoFailback: boolean;
  failbackDelay: number;
}

export interface MonitoringConfigDto {
  enabled: boolean;
  metricsInterval: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    connectionCount: number;
    throughput: number;
  };
}

export interface LoggingConfigDto {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'text';
  includeHeaders: boolean;
  includeBody: boolean;
  retention: number;
}

export interface LoadBalancerMetricsDto {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  currentConnections: number;
  maxConnections: number;
  throughput: number;
  errorRate: number;
  availabilityPercentage: number;
  lastHealthCheck: Date;
  uptime: number;
  bytesTransferred: number;
  requestsPerSecond: number;
}

export interface LoadBalancerImpactDto {
  availabilityImprovement: number;
  latencyReduction: number;
  throughputIncrease: number;
  reliabilityScore: number;
  performanceScore: number;
  costEfficiency: number;
}

export class ReadLoadBalancerDto {
  id: number;
  uuid: string;
  userId: number;
  datacenterId: number;
  deviceId?: number;
  name: string;
  description?: string;
  status: LoadBalancerStatus;
  type: LoadBalancerType;
  algorithm: LoadBalancerAlgorithm;
  enabled: boolean;
  
  virtualIp: string;
  virtualPort: number;
  backendServers: BackendServerDto[];
  
  healthCheckConfig: HealthCheckConfigDto;
  sessionPersistence: SessionPersistenceDto;
  sslConfig: SslConfigDto;
  compressionConfig: CompressionConfigDto;
  cachingConfig: CachingConfigDto;
  rateLimitConfig: RateLimitConfigDto;
  failoverConfig: FailoverConfigDto;
  monitoringConfig: MonitoringConfigDto;
  loggingConfig: LoggingConfigDto;
  
  metrics: LoadBalancerMetricsDto;
  impact: LoadBalancerImpactDto;
  
  tags: string[];
  category: string;
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: number;
  version: number;
  
  datacenter?: {
    id: number;
    name: string;
    location: string;
  };
  
  device?: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
  
  user?: {
    id: number;
    username: string;
    email: string;
  };
}