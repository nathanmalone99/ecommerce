import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  logout() {
    return { message: 'Logged out successfully' };
  }

  @Get('verify')
  @UseGuards(AuthGuard('jwt'))
  verify(@Req() req: { user: unknown }) {
    return { valid: true, user: req.user };
  }

  @Post('register')
  async register(
    @Body()
    dto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
    );
  }
}