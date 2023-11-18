import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { UserService } from 'src/user/service/user.service';
import { User } from 'src/user/model/user.interface';
import { JwtService } from '@nestjs/jwt';

import { compare } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: LoginDto) {
    let foundUser: User;

    try {
      foundUser = await this.userService.userRepo.findOne({
        select: ['id', 'email', 'password', 'username'],
        where: [{ email: user.email }],
      });
    } catch {
      throw new InternalServerErrorException();
    }

    if (!foundUser) {
      throw new ConflictException('User not found');
    }

    const matches = await compare(user.password, foundUser.password);

    if (!matches) {
      throw new ConflictException('Invalid credentials');
    }

    return this.jwtService.signAsync({ foundUser });
  }

  register(user: RegisterDto) {
    /**
     * Validate
     */
  }
}
