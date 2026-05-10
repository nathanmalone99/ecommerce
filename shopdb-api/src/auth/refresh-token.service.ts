import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Generate a random opaque token (64 bytes hex = 128 chars).
   * This is the value sent to the client.
   */
  generateToken(): string {
    return randomBytes(64).toString('hex');
  }

  /**
   * Hash a token for storage.
   * We use SHA-256 (fast, sufficient for already-random tokens — bcrypt would be overkill).
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Save a new refresh token for a user.
   */
  async create(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const entity = this.refreshTokenRepository.create({
      userId,
      tokenHash: this.hashToken(token),
      expiresAt,
      revokedAt: null,
    });
    return this.refreshTokenRepository.save(entity);
  }

  /**
   * Find a valid (non-revoked, non-expired) refresh token by its raw value.
   * Returns null if not found or invalid.
   */
  async findValidByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);
    return this.refreshTokenRepository.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /**
   * Mark a token as revoked (used when rotating, or on logout).
   */
  async revoke(id: number): Promise<void> {
    await this.refreshTokenRepository.update(id, { revokedAt: new Date() });
  }

  /**
   * Revoke ALL tokens for a user (e.g., "log out from all devices").
   */
  async revokeAllForUser(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}