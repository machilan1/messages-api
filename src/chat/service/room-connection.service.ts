import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RoomConnectionEntity } from '../entity/joined-room.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/service/user.service';
import { RoomService } from './room.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { RoomEntity } from '../entity/room.entity';

@Injectable()
export class RoomConnectionService {
  constructor(
    @InjectRepository(RoomConnectionEntity)
    private readonly roomConnectionRepository: Repository<RoomConnectionEntity>,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  /**
   *  Whenever a user clicks on a room option,
   *  and update users on RoomEntity,
   * create an entry to RoomConnectionEntity
   */
  async connectRoom(userId: number, socketId: string, roomId: number) {
    let user: UserEntity;
    let room: RoomEntity;

    await Promise.all([
      this.userService.findOneById(userId),
      this.roomService.findOneById(roomId),
    ])
      .then((value) => {
        [user, room] = value;
      })
      .catch((error) => console.log(error));

    if (!user) throw 'User not found';
    if (!room) throw 'Room not found';

    await this.roomConnectionRepository.save({ socketId, user, room });
  }

  async disconnectAllRoom(socketId: string) {
    try {
      const count = (await this.roomConnectionRepository.delete({ socketId }))
        .affected;
      if (count === undefined || count === null) {
        throw 'Delete failed from roomConnection service';
      }
      return count;
    } catch (error) {
      throw error;
    }
  }

  findByRoomId(roomId: number) {
    return this.roomConnectionRepository.findBy({ room: { id: roomId } });
  }
}
