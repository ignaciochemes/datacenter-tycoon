import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RackManagementService } from '../Services/RackManagementService';
import { CreateRackDto, UpdateRackDto, RackResponseDto, RackWithDevicesDto } from '../Daos/RackDto';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@ApiTags('Rack Management')
@Controller('api/rack-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RackManagementController {
  constructor(private readonly rackManagementService: RackManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rack' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rack created successfully', type: RackResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or datacenter at capacity' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Datacenter not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Body() createRackDto: CreateRackDto): Promise<RackResponseDto> {
    return this.rackManagementService.create(createRackDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all racks or filter by datacenter' })
  @ApiQuery({ name: 'datacenterId', required: false, description: 'Filter racks by datacenter ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of racks', type: [RackResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findAll(@Query('datacenterId') datacenterId?: string): Promise<RackResponseDto[]> {
    if (datacenterId) {
      return this.rackManagementService.findByDatacenter(datacenterId);
    }
    return this.rackManagementService.findAll();
  }

  @Get('datacenter/:datacenterId')
  @ApiOperation({ summary: 'Get all racks in a specific datacenter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of racks in datacenter', type: [RackResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findByDatacenter(@Param('datacenterId') datacenterId: string): Promise<RackResponseDto[]> {
    return this.rackManagementService.findByDatacenter(datacenterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rack by ID with devices' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rack details with devices', type: RackWithDevicesDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rack not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<RackWithDevicesDto> {
    return this.rackManagementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update rack' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rack updated successfully', type: RackResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rack not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or cannot reduce units below used' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateRackDto: UpdateRackDto,
  ): Promise<RackResponseDto> {
    return this.rackManagementService.update(id, updateRackDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete rack' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Rack deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rack not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete rack with existing devices' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.rackManagementService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get rack utilization statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rack utilization stats' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rack not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getUtilizationStats(@Param('id') id: string): Promise<any> {
    return this.rackManagementService.getUtilizationStats(id);
  }
}