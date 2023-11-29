import { Injectable, Options } from '@nestjs/common';
import { Message } from '../model/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entity/message.entity';
import { Repository } from 'typeorm';
import { SendMessageDto } from '../dto/send-message.dto';
import { UserService } from 'src/user/service/user.service';
import { RoomService } from './room.service';
import { WsException } from '@nestjs/websockets';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Room } from '../model/room.interface';
import { SendSystemMessageDto } from '../dto/send-system-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  async sendMessage(message: SendMessageDto) {
    try {
      const author = await this.userService.findOneById(message.authorId);
      if (!author) {
        throw new WsException('User not found');
      }

      const room = await this.roomService.findOneById(message.roomId);

      if (!room) {
        throw new WsException('Room not found');
      }

      const newMessage: Message = { text: message.text, room, author };

      const res = await this.messageRepository.save(newMessage);
      return res;
    } catch (err) {
      throw err;
    }
  }

  async sendSystemMessage(message: SendSystemMessageDto) {
    try {
      const author = await this.userService.findOneById(message.authorId);
      if (!author) {
        throw new WsException('User not found');
      }

      const room = await this.roomService.findOneById(message.roomId);

      if (!room) {
        throw new WsException('Room not found');
      }

      const newMessage: Message = {
        text: message.text,
        room,
        author,
        type: message.type,
      };

      const res = await this.messageRepository.save(newMessage);
      return res;
    } catch (err) {
      throw err;
    }
  }

  async findManyByRoomId(roomId: number) {
    const messages = await this.messageRepository
      .createQueryBuilder('messages')
      .leftJoinAndSelect('messages.room', 'room')
      .leftJoinAndSelect('messages.author', 'author')
      .select(['messages', 'author'])
      .where('room.id = :roomId', { roomId })
      .orderBy('messages.created_at', 'DESC')
      .getMany();
    return messages;
  }
}
