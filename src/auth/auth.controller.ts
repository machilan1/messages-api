import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './service/auth.service';

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
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
}
