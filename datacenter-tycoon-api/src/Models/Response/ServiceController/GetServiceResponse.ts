import { Service } from '../../Entities/ServiceEntity';

export class GetServiceResponse {
    service: Service;

    constructor(service: Service) {
        this.service = service;
    }
}