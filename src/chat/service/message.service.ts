import { Injectable, Options } from '@nestjs/common';
import { Message } from '../model/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entity/message.entity';
import { Repository } from 'typeorm';
import { AddMessageDto } from '../dto/send-message.dto';
import { UserService } from 'src/user/service/user.service';
import { RoomService } from './room.service';
import { WsException } from '@nestjs/websockets';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { Room } from '../model/room.interface';
import { FETCH_LIMIT } from '../constant/constant';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  async sendMessage(message: AddMessageDto) {
    try {
      const author = await this.userService.findOneById(message.authorId);

      if (!author) {
        throw new WsException('User not found');
      }

      const room = await this.roomService.getOneById(message.roomId);

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

  async loadMessageForRoom(roomId: number, lastRoom?: Room) {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.roomId = :roomId AND message.created_at < :date', {
        roomId,
        date: lastRoom?.createdAt ?? new Date(),
      })
      .limit(FETCH_LIMIT)
      .getMany();
    return query;
  }
}
