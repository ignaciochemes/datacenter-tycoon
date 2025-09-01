import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeviceService } from '../Services/DeviceService';
import { CreateDeviceDto, UpdateDeviceDto, DeviceResponseDto } from '../Daos/DeviceDto';
import { DeviceStatus, DeviceType } from '../Models/Device';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';

@ApiTags('Device Management')
@Controller('api/devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Device created successfully', type: DeviceResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or insufficient rack space' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rack not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Body() createDeviceDto: CreateDeviceDto): Promise<DeviceResponseDto> {
    return this.deviceService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices with optional filters' })
  @ApiQuery({ name: 'rackId', required: false, description: 'Filter devices by rack ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter devices by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter devices by type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of devices', type: [DeviceResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findAll(
    @Query('rackId') rackId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<DeviceResponseDto[]> {
    if (rackId) {
      return this.deviceService.findByRack(rackId);
    }
    if (status) {
      return this.deviceService.findByStatus(status as any);
    }
    if (type) {
      return this.deviceService.findByType(type as any);
    }
    return this.deviceService.findAll();
  }

  @Get('rack/:rackId')
  @ApiOperation({ summary: 'Get all devices in a specific rack' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of devices in rack', type: [DeviceResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findByRack(@Param('rackId') rackId: string): Promise<DeviceResponseDto[]> {
    return this.deviceService.findByRack(rackId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get all devices with specific status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of devices with status', type: [DeviceResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findByStatus(@Param('status') status: string): Promise<DeviceResponseDto[]> {
    return this.deviceService.findByStatus(status as DeviceStatus);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get all devices of specific type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of devices of type', type: [DeviceResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findByType(@Param('type') type: string): Promise<DeviceResponseDto[]> {
    return this.deviceService.findByType(type as DeviceType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Device details', type: DeviceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<DeviceResponseDto> {
    return this.deviceService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Device updated successfully', type: DeviceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data or placement conflict' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Device deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.deviceService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get device statistics and details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Device statistics' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Device not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getDeviceStats(@Param('id') id: string): Promise<any> {
    return this.deviceService.getDeviceStats(id);
  }
}