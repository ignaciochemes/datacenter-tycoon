import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datacenter } from '../Models/Datacenter';
import { CreateDatacenterDto, UpdateDatacenterDto, DatacenterResponseDto } from '../Daos/DatacenterDto';

@Injectable()
export class DatacenterManagementService {
  constructor(
    @InjectRepository(Datacenter)
    private datacenterRepository: Repository<Datacenter>,
  ) {}

  async create(createDatacenterDto: CreateDatacenterDto): Promise<DatacenterResponseDto> {
    const existingDatacenter = await this.datacenterRepository.findOne({
      where: { name: createDatacenterDto.name }
    });

    if (existingDatacenter) {
      throw new BadRequestException('Datacenter with this name already exists');
    }

    const datacenter = this.datacenterRepository.create(createDatacenterDto);
    const savedDatacenter = await this.datacenterRepository.save(datacenter);
    
    return this.mapToResponseDto(savedDatacenter);
  }

  async findAll(): Promise<DatacenterResponseDto[]> {
    const datacenters = await this.datacenterRepository.find({
      relations: ['racks'],
      order: { createdAt: 'DESC' }
    });
    
    return datacenters.map(datacenter => this.mapToResponseDto(datacenter));
  }

  async findOne(id: string): Promise<DatacenterResponseDto> {
    const datacenter = await this.datacenterRepository.findOne({
      where: { id },
      relations: ['racks', 'racks.devices']
    });

    if (!datacenter) {
      throw new NotFoundException('Datacenter not found');
    }

    return this.mapToResponseDto(datacenter);
  }

  async update(id: string, updateDatacenterDto: UpdateDatacenterDto): Promise<DatacenterResponseDto> {
    const datacenter = await this.datacenterRepository.findOne({ where: { id } });

    if (!datacenter) {
      throw new NotFoundException('Datacenter not found');
    }

    if (updateDatacenterDto.name && updateDatacenterDto.name !== datacenter.name) {
      const existingDatacenter = await this.datacenterRepository.findOne({
        where: { name: updateDatacenterDto.name }
      });

      if (existingDatacenter) {
        throw new BadRequestException('Datacenter with this name already exists');
      }
    }

    Object.assign(datacenter, updateDatacenterDto);
    const updatedDatacenter = await this.datacenterRepository.save(datacenter);
    
    return this.mapToResponseDto(updatedDatacenter);
  }

  async remove(id: string): Promise<void> {
    const datacenter = await this.datacenterRepository.findOne({
      where: { id },
      relations: ['racks']
    });

    if (!datacenter) {
      throw new NotFoundException('Datacenter not found');
    }

    if (datacenter.racks && datacenter.racks.length > 0) {
      throw new BadRequestException('Cannot delete datacenter with existing racks');
    }

    await this.datacenterRepository.remove(datacenter);
  }

  async getUtilizationStats(id: string): Promise<any> {
    const datacenter = await this.datacenterRepository.findOne({
      where: { id },
      relations: ['racks', 'racks.devices']
    });

    if (!datacenter) {
      throw new NotFoundException('Datacenter not found');
    }

    const totalDevices = datacenter.racks?.reduce((sum, rack) => sum + (rack.devices?.length || 0), 0) || 0;
    const totalUsedUnits = datacenter.racks?.reduce((sum, rack) => sum + rack.usedUnits, 0) || 0;
    const totalAvailableUnits = datacenter.racks?.reduce((sum, rack) => sum + rack.availableUnits, 0) || 0;

    return {
      id: datacenter.id,
      name: datacenter.name,
      totalRacks: datacenter.racks?.length || 0,
      maxRacks: datacenter.maxRacks,
      totalDevices,
      totalUsedUnits,
      totalAvailableUnits,
      powerUtilization: datacenter.powerUtilization,
      coolingUtilization: datacenter.coolingUtilization,
      rackUtilization: datacenter.rackUtilization
    };
  }

  private mapToResponseDto(datacenter: Datacenter): DatacenterResponseDto {
    return {
      id: datacenter.id,
      name: datacenter.name,
      location: datacenter.location,
      description: datacenter.description,
      maxRacks: datacenter.maxRacks,
      powerCapacityKW: datacenter.powerCapacityKW,
      coolingCapacityKW: datacenter.coolingCapacityKW,
      status: datacenter.status,
      currentPowerUsageKW: datacenter.currentPowerUsageKW,
      currentCoolingUsageKW: datacenter.currentCoolingUsageKW,
      powerUtilization: datacenter.powerUtilization,
      coolingUtilization: datacenter.coolingUtilization,
      rackUtilization: datacenter.rackUtilization,
      createdAt: datacenter.createdAt,
      updatedAt: datacenter.updatedAt
    };
  }
}