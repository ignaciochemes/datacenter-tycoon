import { Controller, Post, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HardwareSeedingService } from '../Services/HardwareSeedingService';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@ApiTags('Hardware Seeding')
@Controller('api/hardware-seeding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HardwareSeedingController {
  constructor(
    private readonly hardwareSeedingService: HardwareSeedingService
  ) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed hardware catalog from JSON files' })
  @ApiResponse({ status: 200, description: 'Hardware catalog seeded successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async seedHardwareCatalog(): Promise<{ message: string }> {
    try {
      await this.hardwareSeedingService.seedHardwareCatalog();
      return { message: 'Hardware catalog seeded successfully' };
    } catch (error) {
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get hardware catalog statistics' })
  @ApiResponse({ status: 200, description: 'Hardware catalog statistics retrieved successfully' })
  async getHardwareCatalogStats(): Promise<any> {
    return await this.hardwareSeedingService.getHardwareCatalogStats();
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all hardware catalog data' })
  @ApiResponse({ status: 200, description: 'Hardware catalog cleared successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async clearHardwareCatalog(): Promise<{ message: string }> {
    try {
      await this.hardwareSeedingService.clearHardwareCatalog();
      return { message: 'Hardware catalog cleared successfully' };
    } catch (error) {
      throw error;
    }
  }

  @Post('reseed')
  @ApiOperation({ summary: 'Clear and reseed hardware catalog' })
  @ApiResponse({ status: 200, description: 'Hardware catalog reseeded successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async reseedHardwareCatalog(): Promise<{ message: string }> {
    try {
      await this.hardwareSeedingService.clearHardwareCatalog();
      await this.hardwareSeedingService.seedHardwareCatalog();
      return { message: 'Hardware catalog reseeded successfully' };
    } catch (error) {
      throw error;
    }
  }
}