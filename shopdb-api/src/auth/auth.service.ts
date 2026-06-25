import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Issue both an access token (short-lived JWT) and a refresh token (long-lived opaque token, stored in DB).
   */
  private async issueTokens(userId: number, email: string) {
    // Sign access token (uses default JWT secret + expiration from JwtModule config)
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
    );

    // Generate refresh token: random opaque string + DB record
    const refreshTokenPlain = this.refreshTokenService.generateToken();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const expiresAt = this.parseDurationToDate(refreshExpiresIn);
    await this.refreshTokenService.create(userId, refreshTokenPlain, expiresAt);

    return { accessToken, refreshToken: refreshTokenPlain };
  }

  /**
   * Convert a duration string like '7d' or '15m' to a future Date.
   */
  private parseDurationToDate(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }
    const [, valueStr, unit] = match;
    const value = parseInt(valueStr, 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.userId, user.email);

    return {
      ...tokens,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Exchange a valid refresh token for a new access + refresh token pair.
   * Implements rotation: the old refresh token is revoked.
   */
  async refresh(refreshToken: string) {
    const stored = await this.refreshTokenService.findValidByToken(refreshToken);
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Rotate: revoke the old refresh token, issue new pair
    await this.refreshTokenService.revoke(stored.id);
    const tokens = await this.issueTokens(user.userId, user.email);

    return {
      ...tokens,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Log out: revoke ALL refresh tokens for this user.
   */
  async logout(userId: number) {
    await this.refreshTokenService.revokeAllForUser(userId);
    return { message: 'Logged out successfully' };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    return { userId: user.userId, email: user.email };
  }
}