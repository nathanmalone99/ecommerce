import { Body, Controller, Get, HttpCode, HttpStatus, Post ,Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthenticatedRequest {
  user: {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.userId);
  }

  @Get('verify')
  @UseGuards(AuthGuard('jwt'))
  verify(@Req() req: AuthenticatedRequest) {
    return { valid: true, user: req.user };
  }

  @Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(
    dto.email,
    dto.password,
    dto.firstName,
    dto.lastName,
  );
}
}