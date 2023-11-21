import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomEntity } from '../entity/room.entity';
import { Repository } from 'typeorm';
import { CreateRoomDto } from '../dto/create-room.dto';
import { User } from 'src/user/model/user.interface';
import { Room } from '../model/room.interface';
import {
  IPaginationOptions,
  Pagination,
  paginate,
} from 'nestjs-typeorm-paginate';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
  ) {}

  async createRoom(room: CreateRoomDto, creator: User): Promise<Room> {
    const ids = room.users.map((user) => user.id);
    if (!ids.includes(creator.id)) {
      room.users.push(creator);
    }

    return this.roomRepository.save(room);
  }

  // load room in which user is

  async getRoomForUser(
    userId: number,
    options: IPaginationOptions,
  ): Promise<Pagination<Room>> {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('room.users', 'user')
      .where('user.id = :userId', { userId })
      .leftJoinAndSelect('room.users', 'all_users')
      .orderBy('room.updated_at', 'DESC');
    return paginate(query, options);
  }
}
