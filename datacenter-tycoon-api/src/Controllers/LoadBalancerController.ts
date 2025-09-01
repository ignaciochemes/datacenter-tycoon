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
import { LoadBalancerService } from '../Services/LoadBalancerService';
import { CreateLoadBalancerDto } from '../DTOs/CreateLoadBalancerDto';
import { UpdateLoadBalancerDto } from '../DTOs/UpdateLoadBalancerDto';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@Controller('load-balancers')
@UseGuards(JwtAuthGuard)
export class LoadBalancerController {
  constructor(private readonly loadBalancerService: LoadBalancerService) {}

  @Post()
  async create(@Body() createLoadBalancerDto: CreateLoadBalancerDto, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancer = await this.loadBalancerService.create(createLoadBalancerDto, userId);
      return {
        success: true,
        data: loadBalancer,
        message: 'Load balancer created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create load balancer',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(@Request() req, @Query('datacenterId') datacenterId?: string) {
    try {
      const userId = req.user.id;
      let loadBalancers;
      
      if (datacenterId) {
        loadBalancers = await this.loadBalancerService.findByDatacenter(userId, parseInt(datacenterId));
      } else {
        loadBalancers = await this.loadBalancerService.findAll(userId);
      }
      
      return {
        success: true,
        data: loadBalancers,
        message: 'Load balancers retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve load balancers',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('datacenter/:datacenterId')
  async findByDatacenter(@Param('datacenterId') datacenterId: string, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancers = await this.loadBalancerService.findByDatacenter(userId, parseInt(datacenterId));
      return {
        success: true,
        data: loadBalancers,
        message: 'Load balancers retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve load balancers',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('device/:deviceId')
  async findByDevice(@Param('deviceId') deviceId: string, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancers = await this.loadBalancerService.findByDevice(userId, parseInt(deviceId));
      return {
        success: true,
        data: loadBalancers,
        message: 'Load balancers retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve load balancers',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('active')
  async getActiveLoadBalancers(@Request() req, @Query('datacenterId') datacenterId?: string) {
    try {
      const userId = req.user.id;
      const activeLoadBalancers = await this.loadBalancerService.getActiveLoadBalancers(
        userId,
        datacenterId ? parseInt(datacenterId) : undefined,
      );
      return {
        success: true,
        data: activeLoadBalancers,
        message: 'Active load balancers retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to retrieve active load balancers',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('impact/:datacenterId')
  async getLoadBalancerImpact(@Param('datacenterId') datacenterId: string, @Request() req) {
    try {
      const userId = req.user.id;
      const impact = await this.loadBalancerService.calculateLoadBalancerImpact(userId, parseInt(datacenterId));
      return {
        success: true,
        data: impact,
        message: 'Load balancer impact calculated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to calculate load balancer impact',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/health-check')
  async performHealthCheck(@Param('id') id: string, @Request() req) {
    try {
      const healthStatus = await this.loadBalancerService.performHealthCheck(parseInt(id));
      return {
        success: true,
        data: healthStatus,
        message: 'Health check completed successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to perform health check',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancer = await this.loadBalancerService.findOne(parseInt(id), userId);
      return {
        success: true,
        data: loadBalancer,
        message: 'Load balancer retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Load balancer not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLoadBalancerDto: UpdateLoadBalancerDto, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancer = await this.loadBalancerService.update(parseInt(id), updateLoadBalancerDto, userId);
      return {
        success: true,
        data: loadBalancer,
        message: 'Load balancer updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update load balancer',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancer = await this.loadBalancerService.activate(parseInt(id), userId);
      return {
        success: true,
        data: loadBalancer,
        message: 'Load balancer activated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to activate load balancer',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      const loadBalancer = await this.loadBalancerService.deactivate(parseInt(id), userId);
      return {
        success: true,
        data: loadBalancer,
        message: 'Load balancer deactivated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to deactivate load balancer',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    try {
      const userId = req.user.id;
      await this.loadBalancerService.remove(parseInt(id), userId);
      return {
        success: true,
        message: 'Load balancer deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete load balancer',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}