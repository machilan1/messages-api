import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { User } from '../model/user.interface';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  createUser(registerDto: RegisterDto) {
    return this.userRepository.save(this.userRepository.create(registerDto));
  }

  findWithinArray(userIds: number[]) {
    return this.userRepository.find({ where: { id: In(userIds) } });
  }

  findOneByEmail(email: string) {
    return this.userRepository.findOne({
      select: ['email', 'id', 'password', 'username'],
      where: { email },
    });
  }

  findOneByUsername(username: string) {
    return this.userRepository.findOneBy({ username });
  }

  findOneById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  findOneByIdForRooms(userId) {
    return this.userRepository.findOne({
      relations: ['rooms'],
      where: { id: userId },
    });
  }

  searchManyByName(substring: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username like :substring', {
        substring: '%' + substring + '%',
      })
      .getMany();
  }
}
