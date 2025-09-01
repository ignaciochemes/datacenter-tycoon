import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FirewallRuleService } from '../Services/FirewallRuleService';
import { CreateFirewallRuleDto } from '../DTOs/CreateFirewallRuleDto';
import { UpdateFirewallRuleDto } from '../DTOs/UpdateFirewallRuleDto';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@Controller('firewall-rules')
@UseGuards(JwtAuthGuard)
export class FirewallRuleController {
  constructor(private readonly firewallRuleService: FirewallRuleService) {}

  @Post()
  async create(@Body() createFirewallRuleDto: CreateFirewallRuleDto, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRule = await this.firewallRuleService.create(createFirewallRuleDto, userId);
      return {
        success: true,
        data: firewallRule,
        message: 'Firewall rule created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create firewall rule',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(@Request() req, @Query('datacenterId') datacenterId?: string) {
    try {
      const userId = req.user.id;
      let firewallRules;
      
      if (datacenterId) {
        firewallRules = await this.firewallRuleService.findByDatacenter(userId, parseInt(datacenterId));
      } else {
        firewallRules = await this.firewallRuleService.findAll(userId);
      }
      
      return {
        success: true,
        data: firewallRules,
        message: 'Firewall rules retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve firewall rules',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('datacenter/:datacenterId')
  async findByDatacenter(@Param('datacenterId') datacenterId: string, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRules = await this.firewallRuleService.findByDatacenter(userId, parseInt(datacenterId));
      return {
        success: true,
        data: firewallRules,
        message: 'Firewall rules retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve firewall rules',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('device/:deviceId')
  async findByDevice(@Param('deviceId') deviceId: string, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRules = await this.firewallRuleService.findByDevice(userId, parseInt(deviceId));
      return {
        success: true,
        data: firewallRules,
        message: 'Firewall rules retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve firewall rules',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('active')
  async getActiveRules(@Request() req, @Query('datacenterId') datacenterId?: string) {
    try {
      const userId = req.user.id;
      const activeRules = await this.firewallRuleService.getActiveRules(
        userId,
        datacenterId ? parseInt(datacenterId) : undefined,
      );
      return {
        success: true,
        data: activeRules,
        message: 'Active firewall rules retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve active firewall rules',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('security-impact/:datacenterId')
  async getSecurityImpact(@Param('datacenterId') datacenterId: string, @Request() req) {
    try {
      const userId = req.user.id;
      const impact = await this.firewallRuleService.calculateSecurityImpact(userId, parseInt(datacenterId));
      return {
        success: true,
        data: impact,
        message: 'Security impact calculated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to calculate security impact',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRule = await this.firewallRuleService.findOne(parseInt(id), userId);
      return {
        success: true,
        data: firewallRule,
        message: 'Firewall rule retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Firewall rule not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateFirewallRuleDto: UpdateFirewallRuleDto, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRule = await this.firewallRuleService.update(parseInt(id), updateFirewallRuleDto, userId);
      return {
        success: true,
        data: firewallRule,
        message: 'Firewall rule updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update firewall rule',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRule = await this.firewallRuleService.activate(parseInt(id), userId);
      return {
        success: true,
        data: firewallRule,
        message: 'Firewall rule activated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to activate firewall rule',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const firewallRule = await this.firewallRuleService.deactivate(parseInt(id), userId);
      return {
        success: true,
        data: firewallRule,
        message: 'Firewall rule deactivated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to deactivate firewall rule',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      await this.firewallRuleService.remove(parseInt(id), userId);
      return {
        success: true,
        message: 'Firewall rule deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete firewall rule',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}