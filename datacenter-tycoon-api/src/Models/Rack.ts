import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Datacenter } from './Datacenter';
import { Device } from './Device';

export enum RackStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive'
}

@Entity('racks')
export class Rack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  rackUnits: number;

  @Column({ type: 'int', default: 0 })
  usedUnits: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxPowerKW: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentPowerKW: number;

  @Column({ type: 'enum', enum: RackStatus, default: RackStatus.ACTIVE })
  status: RackStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  datacenterId: string;

  @ManyToOne(() => Datacenter, datacenter => datacenter.racks)
  @JoinColumn({ name: 'datacenterId' })
  datacenter: Datacenter;

  @OneToMany(() => Device, device => device.rack)
  devices: Device[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get availableUnits(): number {
    return this.rackUnits - this.usedUnits;
  }

  get utilizationPercentage(): number {
    return this.rackUnits > 0 ? (this.usedUnits / this.rackUnits) * 100 : 0;
  }

  get powerUtilization(): number {
    return this.maxPowerKW > 0 ? (this.currentPowerKW / this.maxPowerKW) * 100 : 0;
  }

  canFitDevice(requiredUnits: number, requiredPowerKW: number): boolean {
    return this.availableUnits >= requiredUnits && 
           (this.currentPowerKW + requiredPowerKW) <= this.maxPowerKW;
  }
}