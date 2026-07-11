import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';

describe('ServicesService', () => {
  let service: ServicesService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn((v: Partial<Service>) => v as Service),
      save: jest.fn((v: Service) => Promise.resolve({ id: 's-1', ...v })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Service), useValue: repo },
      ],
    }).compile();

    service = module.get(ServicesService);
  });

  it('returns a paginated response', async () => {
    repo.findAndCount.mockResolvedValue([[{ id: 's-1' }], 1]);
    const result = await service.findAll({
      page: 1,
      limit: 10,
      skip: 0,
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('throws NotFound when a service is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFound when deleting a missing service', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
