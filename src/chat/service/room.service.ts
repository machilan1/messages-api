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
import { UserService } from 'src/user/service/user.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    private readonly userService: UserService,
  ) {}

  getOneById(roomId: number) {
    return this.roomRepository.findOneBy({ id: roomId });
  }

  async createRoom(room: CreateRoomDto, creator: User): Promise<Room> {
    if (!room.userIds.includes(creator.id)) {
      room.userIds.push(creator.id);
    }

    const users = await this.userService.findWithinArray(room.userIds);

    const newRoom = {
      name: room.name,
      description: room.description,
      users,
    };

    return this.roomRepository.save(newRoom);
  }
  //
  async getParticipants(roomId: number) {
    const room = await this.roomRepository.findOne({
      relations: ['users'],
      where: { id: roomId },
    });

    return room.users;
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

  async leaveRoom(roomId: number, userId: number) {
    let room: RoomEntity;

    try {
      room = await this.roomRepository
        .createQueryBuilder('room')
        .leftJoinAndSelect('room.users', 'user')
        .where('room.id = :roomId', { roomId })
        .getOne();

      if (!room) {
        throw new WsException('Room not found');
      }

      if (!room.users.map((user) => user.id).includes(userId)) {
        throw new WsException('User is not in the room');
      }
    } catch (error) {
      throw error;
    }

    const editedRoomUsers = room.users.filter((user) => user.id !== userId);
    room.users = editedRoomUsers;

    return this.roomRepository.save(room);
  }

  async joinRoom(roomId: number, userId: number) {
    let user: UserEntity;
    let room: RoomEntity;

    try {
      room = await this.roomRepository.findOneBy({ id: roomId });
      if (!room) {
        throw new Error();
      }
    } catch (error) {
      throw new WsException('Room not found');
    }

    try {
      user = await this.userService.findOneById(userId);
      if (!user) {
        throw new Error();
      }
    } catch (error) {
      throw new WsException('User not found');
    }

    try {
      const roomWithUser = await this.roomRepository
        .createQueryBuilder('room')
        .leftJoinAndSelect('room.users', 'user')
        .select(['room.id', 'user.id'])
        .where('room.id = :roomId', { roomId })
        .getOne();

      console.log(roomWithUser);
      if (roomWithUser.users.map((user) => user.id).includes(userId)) {
        throw new Error();
      }
    } catch (err) {
      throw new WsException('User already in to group');
    }

    return;
  }

  async viewRoom(roomId: number, userId) {
    let roomWithMessages: RoomEntity;

    try {
      const room = await this.roomRepository.findOneBy({ id: roomId });
      if (!room) {
        throw new Error();
      }
    } catch (error) {
      throw new WsException('Room not found');
    }

    try {
      const roomWithUser = await this.roomRepository
        .createQueryBuilder('room')
        .leftJoinAndSelect('room.users', 'user')
        .select(['room.id', 'user.id'])
        .where('room.id = :roomId', { roomId })
        .getOne();

      console.log(roomWithUser);
      if (!roomWithUser.users.map((user) => user.id).includes(userId)) {
        throw new Error();
      }
    } catch (err) {
      throw new WsException('Not authorized to view room');
    }

    try {
      roomWithMessages = await this.roomRepository
        .createQueryBuilder('room')
        .leftJoinAndSelect('room.messages', 'message')
        .leftJoinAndSelect('message.author', 'author')
        .select([
          'room.id',
          'room.name',
          'room.description',
          'room.createdAt',
          'message',
          'author.username',
          'author.id',
        ])
        .where('room.id = :id', { id: roomId })
        .getOne();
    } catch (error) {
      throw new WsException('Room not found');
    }

    return roomWithMessages;
  }
}
