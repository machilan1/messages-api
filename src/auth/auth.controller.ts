import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './service/auth.service';
import { RegisterDto } from './dto/register.dto';

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

interface RegisterResponse {
  username: string;
  email: string;
  id: number;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const jwt = await this.authService.login(loginDto);
    return {
      accessToken: jwt,
      tokenType: 'JWT',
      expiresIn: 10000,
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    const res = await this.authService.register(registerDto);
    return { ...res };
  }
}
