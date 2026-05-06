import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'Users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'UserId' })
  userId!: number;

  @Column({ name: 'FirstName', type: 'nvarchar', length: 50 })
  firstName!: string;

  @Column({ name: 'LastName', type: 'nvarchar', length: 50 })
  lastName!: string;

  @Column({ name: 'Email', type: 'nvarchar', length: 100, unique: true })
  email!: string;

  @Column({ name: 'PasswordHash', type: 'nvarchar', length: 255 })
  passwordHash!: string;

  @CreateDateColumn({ name: 'CreatedAt', type: 'datetime2' })
  createdAt!: Date;
}