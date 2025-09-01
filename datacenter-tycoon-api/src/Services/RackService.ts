import { Injectable } from "@nestjs/common";
import { DatacenterDao } from "../Daos/DatacenterDao";
import { RackDao } from "../Daos/RackDao";
import { UserDao } from "../Daos/UserDao";
import { StatusCodeEnums } from "../Enums/StatusCodeEnums";
import { HttpCustomException } from "../Exceptions/HttpCustomException";
import { Rack, RackStatus } from "../Models/Rack";
import IdResponse from "../Models/Response/IdResponse";
import { JwtSecurityService } from "./Security/JwtSecurityService";

@Injectable()
export class RackService {
    constructor(
        private readonly _rackDao: RackDao,
        private readonly _userDao: UserDao,
        private readonly _datacenterDao: DatacenterDao,
        private readonly _jwtSecurityService: JwtSecurityService
    ) { }

    async create(token: string): Promise<IdResponse> {
        const isValidToken = await this._jwtSecurityService.verifyToken(token);
        if (!isValidToken) throw new HttpCustomException('Invalid token', StatusCodeEnums.INVALID_TOKEN);
        const user = await this._userDao.getUserByUuid(isValidToken.uuid);
        if (!user) throw new HttpCustomException('User not found', StatusCodeEnums.USER_NOT_FOUND);
        const datacenter = await this._datacenterDao.findByUserId(user);
        if (!datacenter) throw new HttpCustomException('User has no datacenter', StatusCodeEnums.USER_HAS_NO_DATACENTER);
        const rack = await this._rackDao.findByUserId(user.getId());
        if (datacenter.getDatacenterType().getMaxRacks() <= rack.length) throw new HttpCustomException('You have reached the maximum number of racks', StatusCodeEnums.MAX_RACKS_REACHED);

        let newRack = new Rack();
        newRack.name = `Rack ${rack.length + 1}`;
        newRack.rackUnits = 42;
        newRack.maxPowerKW = 10.0;
        newRack.datacenterId = datacenter.id.toString();
        newRack.status = RackStatus.ACTIVE;
        await this._rackDao.save(newRack);
        return new IdResponse(1);
    }
}