import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedUserEntity } from '../entity/connected-user.entity';
import { In, Repository } from 'typeorm';
import { UserEntity } from 'src/user/entity/user.entity';
import { error } from 'console';
import { UserService } from 'src/user/service/user.service';
import { RoomService } from './room.service';

@Injectable()
export class ConnectedUserService {
  constructor(
    @InjectRepository(ConnectedUserEntity)
    private readonly connectedUserRepository: Repository<ConnectedUserEntity>,
    private readonly roomService: RoomService,
  ) {}

  addOne(socketId: string, user: UserEntity) {
    return this.connectedUserRepository.save({ socketId, user });
  }

  findOneBySocketId(socketId: string) {
    return this.connectedUserRepository.findOneBy({ socketId });
  }

  async findByRoomId(roomId: number) {
    const userIds = (await this.roomService.findParticipants(roomId)).map(
      (user) => user.id,
    );
    return this.findByInUserIds(userIds);
  }

  findByInUserIds(userIds: number[]) {
    return this.connectedUserRepository.findBy({
      user: In(userIds),
    });
  }

  async deleteBySocketId(socketId: string) {
    try {
      const count = (await this.connectedUserRepository.delete({ socketId }))
        .affected;
      if (count === undefined || count === null) {
        throw 'Delete failed from connected user service';
      }
      return count;
    } catch (error) {
      console.log(error);
    }
  }
}
