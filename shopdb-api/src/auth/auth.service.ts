import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.userId, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
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