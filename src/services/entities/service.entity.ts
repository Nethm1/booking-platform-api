import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { NumericTransformer } from '../../common/transformers/numeric.transformer';

@Entity({ name: 'services' })
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  /** Duration of the service in minutes. */
  @Column({ type: 'int' })
  duration: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  price: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
