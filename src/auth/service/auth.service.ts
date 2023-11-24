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
import { compare, hash } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: LoginDto) {
    let foundUser: User;

    try {
      foundUser = await this.userService.findOneByEmail(user.email);
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

    return this.jwtService.signAsync({ user: foundUser });
  }

  async register(user: RegisterDto) {
    let foundUser: User;

    try {
      foundUser = await this.userService.findOneByUsername(user.username);
    } catch {
      throw new InternalServerErrorException();
    }

    if (foundUser) {
      throw new ConflictException('Username has been taken');
    }

    try {
      foundUser = await this.userService.findOneByEmail(user.email);
    } catch {
      throw new InternalServerErrorException();
    }

    if (foundUser) {
      throw new ConflictException('Email has been taken');
    }

    const passwordHash = await hash(user.password, 12);

    user.password = passwordHash;

    const savedUser = await this.userService.createUser(user);

    return this.userService.findOneById(savedUser.id);
  }

  verifyJwt(jwt: string): Promise<any> {
    return this.jwtService.verifyAsync(jwt);
  }
}
