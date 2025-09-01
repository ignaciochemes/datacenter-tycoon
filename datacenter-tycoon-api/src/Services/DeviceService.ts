import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Device, DeviceStatus, DeviceType } from '../Models/Device';
import { Rack } from '../Models/Rack';
import { CreateDeviceDto, UpdateDeviceDto, DeviceResponseDto } from '../Daos/DeviceDto';
import { DeviceDao } from '../Daos/DeviceDao';
import { RackDao } from '../Daos/RackDao';

@Injectable()
export class DeviceService {
  constructor(
    private deviceDao: DeviceDao,
    private rackDao: RackDao
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceResponseDto> {
    const rack = await this.rackDao.findById(createDeviceDto.rackId);

    if (!rack) {
      throw new NotFoundException('Rack not found');
    }

    if (!rack.canFitDevice(createDeviceDto.rackUnits, createDeviceDto.powerConsumptionKW)) {
      throw new BadRequestException('Not enough available rack units');
    }

    if (createDeviceDto.startUnit) {
      const conflictingDevice = rack.devices?.find((device: Device) => 
        (createDeviceDto.startUnit >= device.startUnit && createDeviceDto.startUnit <= device.endUnit) ||
        (createDeviceDto.startUnit + createDeviceDto.rackUnits - 1 >= device.startUnit && 
         createDeviceDto.startUnit + createDeviceDto.rackUnits - 1 <= device.endUnit)
      );

      if (conflictingDevice) {
        throw new BadRequestException('Device placement conflicts with existing device');
      }
    } else {
      const availableStartUnit = this.findAvailableStartUnit(rack, createDeviceDto.rackUnits);
      if (availableStartUnit === -1) {
        throw new BadRequestException('No contiguous space available for device');
      }
      createDeviceDto.startUnit = availableStartUnit;
    }

    const device = new Device();
    Object.assign(device, {
      ...createDeviceDto,
      rack,
      status: createDeviceDto.status || DeviceStatus.ONLINE,
    });
    
    const savedDevice = await this.deviceDao.save(device);
    return this.mapToResponseDto(savedDevice);
  }

  async findAll(): Promise<DeviceResponseDto[]> {
    const devices = await this.deviceDao.findAll();
    
    return devices.map(device => this.mapToResponseDto(device));
  }

  async findByRack(rackId: string): Promise<DeviceResponseDto[]> {
    const devices = await this.deviceDao.findByRack(rackId);
    
    return devices.map(device => this.mapToResponseDto(device));
  }

  async findOne(id: string): Promise<DeviceResponseDto> {
    const device = await this.deviceDao.findById(id);

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.mapToResponseDto(device);
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<DeviceResponseDto> {
    const device = await this.deviceDao.findById(id);

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (updateDeviceDto.startUnit && updateDeviceDto.startUnit !== device.startUnit) {
      const conflictingDevice = device.rack.devices?.find(d => 
        d.id !== device.id &&
        ((updateDeviceDto.startUnit >= d.startUnit && updateDeviceDto.startUnit <= d.endUnit) ||
         (updateDeviceDto.startUnit + device.rackUnits - 1 >= d.startUnit && 
          updateDeviceDto.startUnit + device.rackUnits - 1 <= d.endUnit))
      );

      if (conflictingDevice) {
        throw new BadRequestException('Device placement conflicts with existing device');
      }
    }

    Object.assign(device, updateDeviceDto);
    const updatedDevice = await this.deviceDao.save(device);
    
    return this.mapToResponseDto(updatedDevice);
  }

  async remove(id: string): Promise<void> {
    const device = await this.deviceDao.findById(id);

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.deviceDao.delete(id);
  }

  async getDeviceStats(id: string): Promise<any> {
    const device = await this.deviceDao.findById(id);

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return {
      id: device.id,
      type: device.type,
      model: device.model,
      manufacturer: device.manufacturer,
      rackUnits: device.rackUnits,
      startUnit: device.startUnit,
      endUnit: device.endUnit,
      powerConsumptionKW: device.powerConsumptionKW,
      heatOutputKW: device.heatOutputKW,
      status: device.status,
      isWarrantyValid: device.isWarrantyValid,
      ageInDays: device.ageInDays,
      rackName: device.rack?.name,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    };
  }

  async findByStatus(status: DeviceStatus): Promise<DeviceResponseDto[]> {
    const devices = await this.deviceDao.findByStatus(status);
    
    return devices.map(device => this.mapToResponseDto(device));
  }

  async findByType(type: DeviceType): Promise<DeviceResponseDto[]> {
    const devices = await this.deviceDao.findByType(type);
    
    return devices.map(device => this.mapToResponseDto(device));
  }

  private findAvailableStartUnit(rack: Rack, requiredUnits: number): number {
    if (!rack.devices || rack.devices.length === 0) {
      return 1;
    }

    const sortedDevices = rack.devices.sort((a: Device, b: Device) => a.startUnit - b.startUnit);
    
    if (sortedDevices[0].startUnit > requiredUnits) {
      return 1;
    }

    for (let i = 0; i < sortedDevices.length - 1; i++) {
      const currentDeviceEnd = sortedDevices[i].endUnit;
      const nextDeviceStart = sortedDevices[i + 1].startUnit;
      const availableSpace = nextDeviceStart - currentDeviceEnd - 1;
      
      if (availableSpace >= requiredUnits) {
        return currentDeviceEnd + 1;
      }
    }

    const lastDeviceEnd = sortedDevices[sortedDevices.length - 1].endUnit;
    const remainingUnits = rack.rackUnits - lastDeviceEnd;
    
    if (remainingUnits >= requiredUnits) {
      return lastDeviceEnd + 1;
    }

    return -1;
  }

  private mapToResponseDto(device: Device): DeviceResponseDto {
    return {
      id: device.id,
      name: device.name,
      type: device.type,
      model: device.model,
      manufacturer: device.manufacturer,
      serialNumber: device.serialNumber,
      rackUnits: device.rackUnits,
      startUnit: device.startUnit,
      endUnit: device.endUnit,
      powerConsumptionKW: device.powerConsumptionKW,
      heatOutputKW: device.heatOutputKW,
      status: device.status,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress,
      description: device.description,
      purchasePrice: device.purchasePrice,
      purchaseDate: device.purchaseDate,
      warrantyExpiry: device.warrantyExpiry,
      isWarrantyValid: device.isWarrantyValid,
      ageInDays: device.ageInDays,
      rackId: device.rack?.id,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    };
  }
}