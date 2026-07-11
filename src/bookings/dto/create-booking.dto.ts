import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @MaxLength(180)
  customerEmail: string;

  @ApiProperty({ example: '+94771234567' })
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'customerPhone must be a valid phone number',
  })
  customerPhone: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2030-01-15', description: 'Date in YYYY-MM-DD.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  bookingDate: string;

  @ApiProperty({ example: '14:30', description: 'Time in HH:mm (24h).' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must be in HH:mm (24h) format',
  })
  bookingTime: string;

  @ApiProperty({ required: false, example: 'Please prepare a quiet room.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
