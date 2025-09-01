import { Controller, Post, Get, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NPCSeedingService } from '../Services/NPCSeedingService';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@ApiTags('NPC Seeding')
@Controller('api/npc-seeding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NPCSeedingController {
  constructor(
    private readonly npcSeedingService: NPCSeedingService
  ) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed NPC catalog from JSON files' })
  @ApiResponse({ status: 200, description: 'NPC catalog seeded successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async seedNPCCatalog(): Promise<{ message: string }> {
    try {
      await this.npcSeedingService.seedNPCCatalog();
      return { message: 'NPC catalog seeded successfully' };
    } catch (error) {
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get NPC catalog statistics' })
  @ApiResponse({ status: 200, description: 'NPC catalog statistics retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getNPCCatalogStats(): Promise<any> {
    try {
      return await this.npcSeedingService.getNPCCatalogStats();
    } catch (error) {
      throw error;
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all NPCs from catalog' })
  @ApiResponse({ status: 200, description: 'NPC catalog cleared successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async clearNPCCatalog(): Promise<{ message: string }> {
    try {
      await this.npcSeedingService.clearNPCCatalog();
      return { message: 'NPC catalog cleared successfully' };
    } catch (error) {
      throw error;
    }
  }

  @Post('reseed')
  @ApiOperation({ summary: 'Clear and reseed NPC catalog' })
  @ApiResponse({ status: 200, description: 'NPC catalog reseeded successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async reseedNPCCatalog(): Promise<{ message: string }> {
    try {
      await this.npcSeedingService.reseedNPCCatalog();
      return { message: 'NPC catalog reseeded successfully' };
    } catch (error) {
      throw error;
    }
  }
}