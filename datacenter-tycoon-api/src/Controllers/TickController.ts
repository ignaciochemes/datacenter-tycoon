import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { TickService } from '../Services/TickService';

@Controller('tick')
export class TickController {
  constructor(private tickService: TickService) {}

  @Post('start')
  async startTicking(@Body() body: { intervalMs?: number }) {
    try {
      const intervalMs = body.intervalMs || 5000;
      
      if (intervalMs < 1000) {
        throw new HttpException(
          'Interval must be at least 1000ms',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.tickService.startTicking(intervalMs);
      
      return {
        success: true,
        message: `Tick service started with ${intervalMs}ms interval`,
        intervalMs,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to start tick service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('stop')
  async stopTicking() {
    try {
      await this.tickService.stopTicking();
      
      return {
        success: true,
        message: 'Tick service stopped',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to stop tick service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  async getTickStatus() {
    try {
      const status = await this.tickService.getQueueStatus();
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get tick status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('current')
  getCurrentTick() {
    return {
      success: true,
      data: {
        currentTick: this.tickService.getCurrentTick(),
        isActive: this.tickService.isTickingActive(),
      },
    };
  }
}