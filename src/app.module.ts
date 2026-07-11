import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { buildDataSourceOptions } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions(process.env),
        // Ensure runtime-loaded env (via ConfigService) is respected.
        autoLoadEntities: false,
        migrationsRun:
          config.get<string>('DB_AUTO_MIGRATE')?.toLowerCase() === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
