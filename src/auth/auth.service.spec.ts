import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    setRefreshToken: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
      verifyAsync: jest.fn(),
    };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
      get: jest.fn().mockReturnValue('15m'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('rejects an already registered email', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u-1' });
      await expect(
        service.register({
          name: 'Jane',
          email: 'jane@example.com',
          password: 'StrongP@ss1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a user and returns tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'u-1',
        name: 'Jane',
        email: 'jane@example.com',
      });

      const result = await service.register({
        name: 'Jane',
        email: 'jane@example.com',
        password: 'StrongP@ss1',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('jane@example.com');
      expect(usersService.setRefreshToken).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects invalid credentials when the user is missing', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'no@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash,
      });
      await expect(
        service.login({ email: 'jane@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('correct', 10);
      usersService.findByEmail.mockResolvedValue({
        id: 'u-1',
        email: 'jane@example.com',
        name: 'Jane',
        passwordHash,
      });
      const result = await service.login({
        email: 'jane@example.com',
        password: 'correct',
      });
      expect(result.accessToken).toBeDefined();
    });
  });
});
