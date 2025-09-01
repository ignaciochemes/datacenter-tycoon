import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatacenterManagementService } from '../Services/DatacenterManagementService';
import { CreateDatacenterDto, UpdateDatacenterDto, DatacenterResponseDto } from '../Daos/DatacenterDto';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@ApiTags('Datacenter Management')
@Controller('api/datacenter-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DatacenterManagementController {
  constructor(private readonly datacenterManagementService: DatacenterManagementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new datacenter' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Datacenter created successfully', type: DatacenterResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Body() createDatacenterDto: CreateDatacenterDto): Promise<DatacenterResponseDto> {
    return this.datacenterManagementService.create(createDatacenterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all datacenters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of datacenters', type: [DatacenterResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findAll(): Promise<DatacenterResponseDto[]> {
    return this.datacenterManagementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get datacenter by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Datacenter details', type: DatacenterResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Datacenter not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<DatacenterResponseDto> {
    return this.datacenterManagementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update datacenter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Datacenter updated successfully', type: DatacenterResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Datacenter not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateDatacenterDto: UpdateDatacenterDto,
  ): Promise<DatacenterResponseDto> {
    return this.datacenterManagementService.update(id, updateDatacenterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete datacenter' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Datacenter deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Datacenter not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete datacenter with existing racks' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.datacenterManagementService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get datacenter utilization statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Datacenter utilization stats' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Datacenter not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getUtilizationStats(@Param('id') id: string): Promise<any> {
    return this.datacenterManagementService.getUtilizationStats(id);
  }
}