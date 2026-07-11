import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/typeorm.config';

loadEnv();

/**
 * Standalone DataSource used by the TypeORM CLI (migration generate/run/revert)
 * and by the seed script. The Nest application configures TypeORM separately
 * via `TypeOrmModule.forRootAsync` in `AppModule`.
 */
export const AppDataSource = new DataSource(
  buildDataSourceOptions(process.env),
);
