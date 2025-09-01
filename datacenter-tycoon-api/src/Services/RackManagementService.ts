import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rack } from '../Models/Rack';
import { Datacenter } from '../Models/Datacenter';
import { CreateRackDto, UpdateRackDto, RackResponseDto, RackWithDevicesDto } from '../Daos/RackDto';

@Injectable()
export class RackManagementService {
  constructor(
    @InjectRepository(Rack)
    private rackRepository: Repository<Rack>,
    @InjectRepository(Datacenter)
    private datacenterRepository: Repository<Datacenter>,
  ) {}

  async create(createRackDto: CreateRackDto): Promise<RackResponseDto> {
    const datacenter = await this.datacenterRepository.findOne({
      where: { id: createRackDto.datacenterId },
      relations: ['racks']
    });

    if (!datacenter) {
      throw new NotFoundException('Datacenter not found');
    }

    if (datacenter.racks && datacenter.racks.length >= datacenter.maxRacks) {
      throw new BadRequestException('Datacenter has reached maximum rack capacity');
    }

    const existingRack = await this.rackRepository.findOne({
      where: { 
        name: createRackDto.name,
        datacenter: { id: createRackDto.datacenterId }
      }
    });

    if (existingRack) {
      throw new BadRequestException('Rack with this name already exists in this datacenter');
    }

    const rack = this.rackRepository.create({
      ...createRackDto,
      datacenter
    });
    
    const savedRack = await this.rackRepository.save(rack);
    return this.mapToResponseDto(savedRack);
  }

  async findAll(): Promise<RackResponseDto[]> {
    const racks = await this.rackRepository.find({
      relations: ['datacenter'],
      order: { createdAt: 'DESC' }
    });
    
    return racks.map(rack => this.mapToResponseDto(rack));
  }

  async findByDatacenter(datacenterId: string): Promise<RackResponseDto[]> {
    const racks = await this.rackRepository.find({
      where: { datacenter: { id: datacenterId } },
      relations: ['datacenter'],
      order: { name: 'ASC' }
    });
    
    return racks.map(rack => this.mapToResponseDto(rack));
  }

  async findOne(id: string): Promise<RackWithDevicesDto> {
    const rack = await this.rackRepository.findOne({
      where: { id },
      relations: ['datacenter', 'devices']
    });

    if (!rack) {
      throw new NotFoundException('Rack not found');
    }

    return this.mapToWithDevicesDto(rack);
  }

  async update(id: string, updateRackDto: UpdateRackDto): Promise<RackResponseDto> {
    const rack = await this.rackRepository.findOne({
      where: { id },
      relations: ['datacenter', 'devices']
    });

    if (!rack) {
      throw new NotFoundException('Rack not found');
    }

    if (updateRackDto.name && updateRackDto.name !== rack.name) {
      const existingRack = await this.rackRepository.findOne({
        where: { 
          name: updateRackDto.name,
          datacenter: { id: rack.datacenter.id }
        }
      });

      if (existingRack) {
        throw new BadRequestException('Rack with this name already exists in this datacenter');
      }
    }

    if (updateRackDto.rackUnits && updateRackDto.rackUnits < rack.usedUnits) {
      throw new BadRequestException('Cannot reduce rack units below currently used units');
    }

    Object.assign(rack, updateRackDto);
    const updatedRack = await this.rackRepository.save(rack);
    
    return this.mapToResponseDto(updatedRack);
  }

  async remove(id: string): Promise<void> {
    const rack = await this.rackRepository.findOne({
      where: { id },
      relations: ['devices']
    });

    if (!rack) {
      throw new NotFoundException('Rack not found');
    }

    if (rack.devices && rack.devices.length > 0) {
      throw new BadRequestException('Cannot delete rack with existing devices');
    }

    await this.rackRepository.remove(rack);
  }

  async getUtilizationStats(id: string): Promise<any> {
    const rack = await this.rackRepository.findOne({
      where: { id },
      relations: ['devices']
    });

    if (!rack) {
      throw new NotFoundException('Rack not found');
    }

    const totalDevices = rack.devices?.length || 0;
    const totalPowerConsumption = rack.devices?.reduce((sum, device) => sum + device.powerConsumptionKW, 0) || 0;
    const totalHeatOutput = rack.devices?.reduce((sum, device) => sum + device.heatOutputKW, 0) || 0;

    return {
      id: rack.id,
      name: rack.name,
      totalDevices,
      usedUnits: rack.usedUnits,
      availableUnits: rack.availableUnits,
      utilizationPercentage: rack.utilizationPercentage,
      totalPowerConsumption,
      totalHeatOutput,
      powerUtilization: rack.powerUtilization,
      status: rack.status
    };
  }

  private mapToResponseDto(rack: Rack): RackResponseDto {
    return {
      id: rack.id,
      name: rack.name,
      rackUnits: rack.rackUnits,
      usedUnits: rack.usedUnits,
      availableUnits: rack.availableUnits,
      maxPowerKW: rack.maxPowerKW,
      currentPowerKW: rack.currentPowerKW,
      status: rack.status,
      utilizationPercentage: rack.utilizationPercentage,
      powerUtilization: rack.powerUtilization,
      datacenterId: rack.datacenter?.id,
      createdAt: rack.createdAt,
      updatedAt: rack.updatedAt
    };
  }

  private mapToWithDevicesDto(rack: Rack): RackWithDevicesDto {
    return {
      ...this.mapToResponseDto(rack),
      devices: rack.devices?.map(device => ({
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
        createdAt: device.createdAt
      })) || []
    };
  }
}