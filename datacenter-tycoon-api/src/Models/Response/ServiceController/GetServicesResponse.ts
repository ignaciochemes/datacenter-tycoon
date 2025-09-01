import { Service } from '../../Entities/ServiceEntity';

export class GetServicesResponse {
    services: Service[];
    total: number;

    constructor(services: Service[]) {
        this.services = services;
        this.total = services.length;
    }
}