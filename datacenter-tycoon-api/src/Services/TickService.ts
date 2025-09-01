import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

export interface TickData {
  tickNumber: number;
  timestamp: Date;
  gameState: {
    totalServers: number;
    totalRevenue: number;
    totalPowerConsumption: number;
  };
}

@Injectable()
export class TickService extends EventEmitter {
  private logger: Logger = new Logger('TickService');
  private currentTick: number = 0;
  private isRunning: boolean = false;
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  async startTicking(intervalMs: number = 5000) {
    if (this.isRunning) {
      this.logger.warn('Tick service is already running');
      return;
    }

    this.isRunning = true;
    this.logger.log(`Starting tick service with ${intervalMs}ms interval`);

    this.tickInterval = setInterval(() => {
      this.processTick(this.currentTick);
    }, intervalMs);
  }

  async stopTicking() {
    if (!this.isRunning) {
      this.logger.warn('Tick service is not running');
      return;
    }

    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.logger.log('Tick service stopped');
  }

  async processTick(tickNumber: number): Promise<TickData> {
    this.currentTick = tickNumber + 1;
    
    const tickData: TickData = {
      tickNumber: this.currentTick,
      timestamp: new Date(),
      gameState: {
        totalServers: Math.floor(Math.random() * 100),
        totalRevenue: Math.floor(Math.random() * 10000),
        totalPowerConsumption: Math.floor(Math.random() * 5000),
      },
    };

    this.logger.debug(`Processing tick ${this.currentTick}`);
    
    this.emit('tick', tickData);
    
    return tickData;
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  isTickingActive(): boolean {
    return this.isRunning;
  }

  async getQueueStatus() {
    return {
      isRunning: this.isRunning,
      currentTick: this.currentTick,
      hasInterval: this.tickInterval !== null,
    };
  }
}