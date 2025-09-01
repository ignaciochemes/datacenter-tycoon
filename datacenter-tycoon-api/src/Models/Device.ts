import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Rack } from './Rack';

export enum DeviceType {
  SERVER = 'server',
  SWITCH = 'switch',
  ROUTER = 'router',
  FIREWALL = 'firewall',
  STORAGE = 'storage',
  UPS = 'ups',
  PDU = 'pdu'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: DeviceType })
  type: DeviceType;

  @Column({ type: 'varchar', length: 255 })
  model: string;

  @Column({ type: 'varchar', length: 255 })
  manufacturer: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialNumber: string;

  @Column({ type: 'int' })
  rackUnits: number;

  @Column({ type: 'int' })
  startUnit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  powerConsumptionKW: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  heatOutputKW: number;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE })
  status: DeviceStatus;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 17, nullable: true })
  macAddress: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  purchasePrice: number;

  @Column({ type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry: Date;

  @Column({ type: 'uuid' })
  rackId: string;

  @ManyToOne(() => Rack, rack => rack.devices)
  @JoinColumn({ name: 'rackId' })
  rack: Rack;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get endUnit(): number {
    return this.startUnit + this.rackUnits - 1;
  }

  get isWarrantyValid(): boolean {
    if (!this.warrantyExpiry) return false;
    return new Date() <= this.warrantyExpiry;
  }

  get ageInDays(): number {
    if (!this.purchaseDate) return 0;
    const diffTime = Math.abs(new Date().getTime() - this.purchaseDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}