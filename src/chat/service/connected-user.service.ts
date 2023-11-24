import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedUserEntity } from '../entity/connected-user.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class ConnectedUserService {
  constructor(
    @InjectRepository(ConnectedUserEntity)
    private readonly connectedUserRepository: Repository<ConnectedUserEntity>,
  ) {}

  connectedUserRepo = this.connectedUserRepository;

  findOneBySocketId(socketId: string) {
    return this.connectedUserRepository.findOneBy({ socketId });
  }

  findManyByInUserIds(userIds: number[]) {
    return this.connectedUserRepository.findBy({
      user: In(userIds),
    });
  }

  deleteBySocketId(socketId: string) {
    return this.connectedUserRepository.delete({ socketId });
  }
}
