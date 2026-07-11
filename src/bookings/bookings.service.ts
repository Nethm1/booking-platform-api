import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Service } from '../services/entities/service.entity';
import { BookingStatus } from './enums/booking-status.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    const service = await this.servicesRepository.findOne({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service ${dto.serviceId} does not exist`);
    }
    if (!service.isActive) {
      throw new BadRequestException(
        'The selected service is not available for booking',
      );
    }

    this.assertNotInPast(dto.bookingDate, dto.bookingTime);

    const duplicate = await this.bookingsRepository.findOne({
      where: {
        serviceId: dto.serviceId,
        bookingDate: dto.bookingDate,
        bookingTime: dto.bookingTime,
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'A booking already exists for this service at the selected date and time',
      );
    }

    const booking = this.bookingsRepository.create({
      ...dto,
      notes: dto.notes ?? null,
      status: BookingStatus.PENDING,
    });
    return this.bookingsRepository.save(booking);
  }

  async findAll(query: QueryBookingDto): Promise<PaginatedResponse<Booking>> {
    const { page, limit, skip, search, status, serviceId } = query;

    const qb = this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .orderBy('booking.bookingDate', 'DESC')
      .addOrderBy('booking.bookingTime', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      qb.andWhere('booking.status = :status', { status });
    }
    if (serviceId) {
      qb.andWhere('booking.serviceId = :serviceId', { serviceId });
    }
    if (search) {
      qb.andWhere(
        '(booking.customerName ILIKE :search OR booking.customerEmail ILIKE :search OR booking.customerPhone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: { service: true },
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }
    return booking;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);

    if (
      booking.status === BookingStatus.CANCELLED &&
      status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'A cancelled booking cannot be marked as completed',
      );
    }

    booking.status = status;
    return this.bookingsRepository.save(booking);
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('A completed booking cannot be cancelled');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }

  private assertNotInPast(bookingDate: string, bookingTime: string): void {
    const scheduled = new Date(`${bookingDate}T${bookingTime}:00`);
    if (Number.isNaN(scheduled.getTime())) {
      throw new BadRequestException('Invalid booking date or time');
    }
    if (scheduled.getTime() < Date.now()) {
      throw new BadRequestException('Booking date/time cannot be in the past');
    }
  }
}
