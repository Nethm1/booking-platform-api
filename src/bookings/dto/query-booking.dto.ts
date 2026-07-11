import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { BookingStatus } from '../enums/booking-status.enum';

export class QueryBookingDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive search over customer name, email and phone.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Filter by status.',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by service id.' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
