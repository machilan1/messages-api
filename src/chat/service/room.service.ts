import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomEntity } from '../entity/room.entity';
import { In, Repository } from 'typeorm';
import { CreateRoomDto } from '../dto/create-room.dto';
import { User } from 'src/user/model/user.interface';
import { Room } from '../model/room.interface';
import {
  IPaginationOptions,
  Pagination,
  paginate,
} from 'nestjs-typeorm-paginate';
import { UserService } from 'src/user/service/user.service';
import { UserEntity } from 'src/user/entity/user.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    private readonly userService: UserService,
  ) {}

  roomRepo = this.roomRepository;

  async createRoom(room: CreateRoomDto, creator: User): Promise<Room> {
    if (!room.userIds.includes(creator.id)) {
      room.userIds.push(creator.id);
    }

    const users = await this.userService.userRepo.find({
      where: { id: In(room.userIds) },
    });

    const newRoom = {
      name: room.name,
      description: room.description,
      users,
    };

    return this.roomRepository.save(newRoom);
  }

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
