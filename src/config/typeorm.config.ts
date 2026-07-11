import { DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { Booking } from '../bookings/entities/booking.entity';

type EnvLike = Record<string, string | undefined>;

const toBool = (value: string | undefined): boolean =>
  value?.toLowerCase() === 'true';

/**
 * Builds the TypeORM connection options from environment variables.
 * Shared between the Nest application and the standalone CLI DataSource
 * used for migrations and seeding.
 */
export const buildDataSourceOptions = (env: EnvLike): DataSourceOptions => ({
  type: 'postgres',
  host: env.DB_HOST ?? 'localhost',
  port: parseInt(env.DB_PORT ?? '5432', 10),
  username: env.DB_USERNAME ?? 'postgres',
  password: env.DB_PASSWORD ?? 'postgres',
  database: env.DB_NAME ?? 'booking_platform',
  entities: [User, Service, Booking],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  synchronize: false,
  migrationsRun: toBool(env.DB_AUTO_MIGRATE),
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
