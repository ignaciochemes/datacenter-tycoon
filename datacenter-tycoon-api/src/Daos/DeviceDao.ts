import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus, DeviceType } from '../Models/Device';

@Injectable()
export class DeviceDao {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>
  ) {}

  async save(device: Device): Promise<Device> {
    return await this.deviceRepository.save(device);
  }

  async findById(id: string): Promise<Device | null> {
    return await this.deviceRepository.findOne({
      where: { id },
      relations: ['rack', 'rack.datacenter']
    });
  }

  async findAll(): Promise<Device[]> {
    return await this.deviceRepository.find({
      relations: ['rack', 'rack.datacenter'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByRack(rackId: string): Promise<Device[]> {
    return await this.deviceRepository.find({
      where: { rack: { id: rackId } },
      relations: ['rack'],
      order: { startUnit: 'ASC' }
    });
  }

  async findByDatacenter(datacenterId: string): Promise<Device[]> {
    return await this.deviceRepository.find({
      where: { rack: { datacenter: { id: datacenterId } } },
      relations: ['rack', 'rack.datacenter'],
      order: { rack: { name: 'ASC' }, startUnit: 'ASC' }
    });
  }

  async delete(id: string): Promise<void> {
    await this.deviceRepository.delete(id);
  }

  async findOverlappingDevices(rackId: string, startUnit: number, endUnit: number, excludeDeviceId?: string): Promise<Device[]> {
    const query = this.deviceRepository
      .createQueryBuilder('device')
      .where('device.rackId = :rackId', { rackId })
      .andWhere(
        '(device.startUnit <= :endUnit AND device.endUnit >= :startUnit)',
        { startUnit, endUnit }
      );

    if (excludeDeviceId) {
      query.andWhere('device.id != :excludeDeviceId', { excludeDeviceId });
    }

    return await query.getMany();
  }

  async getDeviceStatsByRack(rackId: string): Promise<{
    totalDevices: number;
    usedUnits: number;
    totalPowerConsumption: number;
    totalHeatOutput: number;
  }> {
    const result = await this.deviceRepository
      .createQueryBuilder('device')
      .select([
        'COUNT(device.id) as totalDevices',
        'COALESCE(SUM(device.rackUnits), 0) as usedUnits',
        'COALESCE(SUM(device.powerConsumptionKW), 0) as totalPowerConsumption',
        'COALESCE(SUM(device.heatOutputKW), 0) as totalHeatOutput'
      ])
      .where('device.rackId = :rackId', { rackId })
      .getRawOne();

    return {
      totalDevices: parseInt(result.totalDevices) || 0,
      usedUnits: parseInt(result.usedUnits) || 0,
      totalPowerConsumption: parseFloat(result.totalPowerConsumption) || 0,
      totalHeatOutput: parseFloat(result.totalHeatOutput) || 0
    };
  }

  async getDeviceStatsByDatacenter(datacenterId: string): Promise<{
    totalDevices: number;
    usedUnits: number;
    totalPowerConsumption: number;
    totalHeatOutput: number;
  }> {
    const result = await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoin('device.rack', 'rack')
      .select([
        'COUNT(device.id) as totalDevices',
        'COALESCE(SUM(device.rackUnits), 0) as usedUnits',
        'COALESCE(SUM(device.powerConsumptionKW), 0) as totalPowerConsumption',
        'COALESCE(SUM(device.heatOutputKW), 0) as totalHeatOutput'
      ])
      .where('rack.datacenterId = :datacenterId', { datacenterId })
      .getRawOne();

    return {
      totalDevices: parseInt(result.totalDevices) || 0,
      usedUnits: parseInt(result.usedUnits) || 0,
      totalPowerConsumption: parseFloat(result.totalPowerConsumption) || 0,
      totalHeatOutput: parseFloat(result.totalHeatOutput) || 0
    };
  }

  async findByStatus(status: DeviceStatus): Promise<Device[]> {
    return await this.deviceRepository.find({
      where: { status },
      relations: ['rack', 'rack.datacenter'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByType(type: DeviceType): Promise<Device[]> {
    return await this.deviceRepository.find({
      where: { type },
      relations: ['rack', 'rack.datacenter'],
      order: { createdAt: 'DESC' }
    });
  }
}