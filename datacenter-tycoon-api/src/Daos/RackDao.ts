import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Rack } from "../Models/Rack";
import { Repository } from "typeorm";

@Injectable()
export class RackDao {
    constructor(@InjectRepository(Rack) private _ramRepository: Repository<Rack>) { }

    async save(data: Rack): Promise<Rack> {
        return await this._ramRepository.save(data);
    }

    async findById(id: string): Promise<Rack | null> {
        return await this._ramRepository.findOne({
            where: { id },
            relations: ['devices', 'datacenter']
        });
    }

    async findByUserId(userId: number): Promise<Rack[]> {
        const query = this._ramRepository.createQueryBuilder("rack")
            .leftJoinAndSelect("rack.datacenterId", "datacenter")
            .leftJoinAndSelect("datacenter.userId", "user")
            .where("user.id = :userId", { userId });
        return await query.getMany();
    }

    async findAll(): Promise<Rack[]> {
        return await this._ramRepository.find({
            relations: ['devices', 'datacenter']
        });
    }

    async delete(id: string): Promise<void> {
        await this._ramRepository.delete(id);
    }
}