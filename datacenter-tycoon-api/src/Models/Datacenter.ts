import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Rack } from './Rack';

export enum DatacenterStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive'
}

@Entity('datacenters')
export class Datacenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  maxRacks: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  powerCapacityKW: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  coolingCapacityKW: number;

  @Column({ type: 'enum', enum: DatacenterStatus, default: DatacenterStatus.ACTIVE })
  status: DatacenterStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentPowerUsageKW: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentCoolingUsageKW: number;

  @OneToMany(() => Rack, rack => rack.datacenter)
  racks: Rack[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get powerUtilization(): number {
    return this.powerCapacityKW > 0 ? (this.currentPowerUsageKW / this.powerCapacityKW) * 100 : 0;
  }

  get coolingUtilization(): number {
    return this.coolingCapacityKW > 0 ? (this.currentCoolingUsageKW / this.coolingCapacityKW) * 100 : 0;
  }

  get rackUtilization(): number {
    return this.maxRacks > 0 ? (this.racks?.length || 0 / this.maxRacks) * 100 : 0;
  }
}