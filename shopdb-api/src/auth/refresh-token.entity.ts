import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'RefreshTokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id!: number;

  @Column({ name: 'UserId', type: 'int' })
  userId!: number;

  @Column({ name: 'TokenHash', type: 'nvarchar', length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: 'ExpiresAt', type: 'datetime2' })
  expiresAt!: Date;

  @Column({ name: 'RevokedAt', type: 'datetime2', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'CreatedAt', type: 'datetime2' })
  createdAt!: Date;
}