import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Datacenter } from '../Models/Datacenter';
import { Rack } from '../Models/Rack';
import { Device } from '../Models/Device';
import { DatacenterManagementService } from '../Services/DatacenterManagementService';
import { RackManagementService } from '../Services/RackManagementService';
import { DeviceService } from '../Services/DeviceService';
import { DatacenterManagementController } from '../Controllers/DatacenterManagementController';
import { RackManagementController } from '../Controllers/RackManagementController';
import { DeviceController } from '../Controllers/DeviceController';
import { HardwareSeedingController } from '../Controllers/HardwareSeedingController';
import { DatacenterDao } from '../Daos/DatacenterDao';
import { RackDao } from '../Daos/RackDao';
import { DeviceDao } from '../Daos/DeviceDao';
import { JwtSecurityService } from '../Services/Security/JwtSecurityService';
import { HardwareSeedingService } from '../Services/HardwareSeedingService';

@Module({
  imports: [
    TypeOrmModule.forFeature([Datacenter, Rack, Device]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' }
    })
  ],
  controllers: [
    DatacenterManagementController,
    RackManagementController,
    DeviceController,
    HardwareSeedingController
  ],
  providers: [
    DatacenterManagementService,
    RackManagementService,
    DeviceService,
    HardwareSeedingService,
    DatacenterDao,
    RackDao,
    DeviceDao,
    JwtSecurityService
  ],
  exports: [
    DatacenterManagementService,
    RackManagementService,
    DeviceService,
    HardwareSeedingService
  ]
})
export class DatacenterManagementModule {}