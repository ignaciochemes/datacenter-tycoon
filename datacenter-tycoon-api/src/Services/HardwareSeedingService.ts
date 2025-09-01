import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus, DeviceType } from '../Models/Device';
import * as fs from 'fs';
import * as path from 'path';

interface HardwareItem {
  id: string;
  name: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  description: string;
  specifications: Record<string, any>;
  rackUnits: number;
  powerConsumption: number;
  price: number;
  availability: boolean;
  category: string;
}

interface HardwareCatalog {
  catalogs: Record<string, string>;
  categories: Record<string, any>;
  deviceTypes: Record<string, any>;
  metadata: Record<string, any>;
}

@Injectable()
export class HardwareSeedingService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async seedHardwareCatalog(): Promise<void> {
    try {
      const seedsPath = path.join(__dirname, '../Seeds/Hardware');
      const indexPath = path.join(seedsPath, 'index.json');
      
      if (!fs.existsSync(indexPath)) {
        throw new Error('Hardware catalog index not found');
      }

      const catalogIndex: HardwareCatalog = JSON.parse(
        fs.readFileSync(indexPath, 'utf8')
      );

      console.log('Starting hardware catalog seeding...');
      let totalSeeded = 0;

      for (const [catalogName, catalogFile] of Object.entries(catalogIndex.catalogs)) {
        const catalogPath = path.join(seedsPath, catalogFile.replace('./', ''));
        
        if (!fs.existsSync(catalogPath)) {
          console.warn(`Catalog file not found: ${catalogPath}`);
          continue;
        }

        const hardwareItems: HardwareItem[] = JSON.parse(
          fs.readFileSync(catalogPath, 'utf8')
        );

        console.log(`Seeding ${catalogName} catalog with ${hardwareItems.length} items...`);

        for (const item of hardwareItems) {
          await this.createOrUpdateHardwareItem(item);
          totalSeeded++;
        }
      }

      console.log(`Hardware catalog seeding completed. Total items seeded: ${totalSeeded}`);
    } catch (error) {
      console.error('Error seeding hardware catalog:', error);
      throw error;
    }
  }

  private async createOrUpdateHardwareItem(item: HardwareItem): Promise<Device> {
    const existingDevice = await this.deviceRepository.findOne({
      where: { serialNumber: item.id }
    });

    if (existingDevice) {
      existingDevice.name = item.name;
      existingDevice.type = item.type as any;
      existingDevice.manufacturer = item.manufacturer;
      existingDevice.model = item.model;
      existingDevice.rackUnits = item.rackUnits;
      existingDevice.powerConsumptionKW = item.powerConsumption;
      existingDevice.purchasePrice = item.price;
      existingDevice.status = item.availability ? DeviceStatus.ONLINE : DeviceStatus.MAINTENANCE;
      existingDevice.description = JSON.stringify(item.specifications);
      
      return await this.deviceRepository.save(existingDevice);
    } else {
      const newDevice = this.deviceRepository.create({
        serialNumber: item.id,
        name: item.name,
        type: item.type as any,
        manufacturer: item.manufacturer,
        model: item.model,
        description: JSON.stringify(item.specifications),
        rackUnits: item.rackUnits,
        startUnit: 1,
        powerConsumptionKW: item.powerConsumption,
        purchasePrice: item.price,
        status: item.availability ? DeviceStatus.ONLINE : DeviceStatus.MAINTENANCE,
        purchaseDate: new Date(),
        warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
        rackId: '00000000-0000-0000-0000-000000000000' // Temporary UUID
      });

      return await this.deviceRepository.save(newDevice);
    }
  }

  async getHardwareCatalogStats(): Promise<any> {
    const stats = await this.deviceRepository
      .createQueryBuilder('device')
      .select('device.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(device.purchasePrice)', 'avgPrice')
      .addSelect('SUM(device.powerConsumption)', 'totalPower')
      .groupBy('device.type')
      .getRawMany();

    const totalDevices = await this.deviceRepository.count();
    const totalValue = await this.deviceRepository
      .createQueryBuilder('device')
      .select('SUM(device.purchasePrice)', 'total')
      .getRawOne();

    return {
      totalDevices,
      totalValue: parseFloat(totalValue.total) || 0,
      byType: stats.map(stat => ({
        type: stat.type,
        count: parseInt(stat.count),
        avgPrice: parseFloat(stat.avgPrice) || 0,
        totalPower: parseFloat(stat.totalPower) || 0
      }))
    };
  }

  async clearHardwareCatalog(): Promise<void> {
    console.log('Clearing existing hardware catalog...');
    await this.deviceRepository.delete({});
    console.log('Hardware catalog cleared.');
  }
}