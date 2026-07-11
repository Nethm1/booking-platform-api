import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  create(dto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepository.create(dto);
    return this.servicesRepository.save(service);
  }

  async findAll(query: QueryServiceDto): Promise<PaginatedResponse<Service>> {
    const { page, limit, skip, search, isActive } = query;

    const where = search
      ? [
          { title: ILike(`%${search}%`) },
          { description: ILike(`%${search}%`) },
        ].map((clause) =>
          isActive === undefined ? clause : { ...clause, isActive },
        )
      : isActive === undefined
        ? {}
        : { isActive };

    const [data, total] = await this.servicesRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const result = await this.servicesRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Service ${id} not found`);
    }
  }
}
