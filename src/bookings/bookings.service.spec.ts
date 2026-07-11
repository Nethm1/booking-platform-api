import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { BookingStatus } from './enums/booking-status.enum';
import { CreateBookingDto } from './dto/create-booking.dto';

const FUTURE_DATE = '2999-01-15';

const baseDto = (): CreateBookingDto => ({
  customerName: 'John Smith',
  customerEmail: 'john@example.com',
  customerPhone: '+94771234567',
  serviceId: 'service-1',
  bookingDate: FUTURE_DATE,
  bookingTime: '14:30',
});

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingsRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let servicesRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    bookingsRepo = {
      findOne: jest.fn(),
      create: jest.fn((v: Partial<Booking>) => v as Booking),
      save: jest.fn((v: Booking) => Promise.resolve({ id: 'b-1', ...v })),
      createQueryBuilder: jest.fn(),
    };
    servicesRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingsRepo },
        { provide: getRepositoryToken(Service), useValue: servicesRepo },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  describe('create', () => {
    it('creates a PENDING booking for an active existing service', async () => {
      servicesRepo.findOne.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });
      bookingsRepo.findOne.mockResolvedValue(null);

      const result = await service.create(baseDto());

      expect(result.status).toBe(BookingStatus.PENDING);
      expect(bookingsRepo.save).toHaveBeenCalled();
    });

    it('throws NotFound when the service does not exist', async () => {
      servicesRepo.findOne.mockResolvedValue(null);
      await expect(service.create(baseDto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequest when the service is inactive', async () => {
      servicesRepo.findOne.mockResolvedValue({
        id: 'service-1',
        isActive: false,
      });
      await expect(service.create(baseDto())).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequest for a booking date in the past', async () => {
      servicesRepo.findOne.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });
      const dto = { ...baseDto(), bookingDate: '2000-01-01' };
      await expect(service.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws Conflict for a duplicate service/date/time slot', async () => {
      servicesRepo.findOne.mockResolvedValue({
        id: 'service-1',
        isActive: true,
      });
      bookingsRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create(baseDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('updateStatus', () => {
    it('prevents marking a cancelled booking as completed', async () => {
      bookingsRepo.findOne.mockResolvedValue({
        id: 'b-1',
        status: BookingStatus.CANCELLED,
      });
      await expect(
        service.updateStatus('b-1', BookingStatus.COMPLETED),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates the status for a valid transition', async () => {
      bookingsRepo.findOne.mockResolvedValue({
        id: 'b-1',
        status: BookingStatus.PENDING,
      });
      const result = await service.updateStatus('b-1', BookingStatus.CONFIRMED);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancel', () => {
    it('prevents cancelling a completed booking', async () => {
      bookingsRepo.findOne.mockResolvedValue({
        id: 'b-1',
        status: BookingStatus.COMPLETED,
      });
      await expect(service.cancel('b-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('sets the status to CANCELLED', async () => {
      bookingsRepo.findOne.mockResolvedValue({
        id: 'b-1',
        status: BookingStatus.PENDING,
      });
      const result = await service.cancel('b-1');
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });
});
