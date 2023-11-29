import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomEntity } from '../entity/room.entity';
import { Repository } from 'typeorm';
import { CreateRoomDto } from '../dto/create-room.dto';
import { User } from 'src/user/model/user.interface';
import { Room } from '../model/room.interface';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
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

  findOneById(roomId: number) {
    return this.roomRepository.findOne({
      where: { id: roomId },
    });
  }

  async createRoom(room: CreateRoomDto, creator: User): Promise<Room> {
    if (!room.userIds) {
      throw 'No user id provided in the payload';
    }

    if (room.userIds.length < 1) {
      throw 'No user id provided in the payload';
    }

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

  async findRoomForUser(userId: number, options: IPaginationOptions) {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoin('room.users', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('room.updated_at', 'DESC');
    return paginate(query, options);
  }

  async findManyByUserId(userId: number) {
    return this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.users', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
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
      const roomWithUser = await this.roomRepository.findOne({
        relations: ['users'],
        where: { id: roomId },
      });
      if (roomWithUser.users.map((user) => user.id).includes(userId)) {
        throw new Error();
      } else {
        roomWithUser.users.push(user);
      }
      return roomWithUser;
    } catch (err) {
      throw new WsException('User already in the group');
    }
  }

  async viewRoom(roomId: number, userId: number) {
    let roomWithMessages: RoomEntity;
    let roomWithUser: RoomEntity;

    try {
      const room = await this.roomRepository.findOneBy({ id: roomId });
      if (!room) {
        throw new Error();
      }
    } catch (error) {
      throw new WsException('Room not found');
    }

    try {
      roomWithUser = await this.roomRepository.findOne({
        relations: ['users'],
        where: { id: roomId },
      });

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

  async findParticipants(roomId: number): Promise<UserEntity[]> {
    const room = await this.roomRepository.findOne({
      relations: ['users'],
      where: { id: roomId },
    });

    return room.users;
  }
}
