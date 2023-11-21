import { Injectable } from '@nestjs/common';
import { Message } from '../model/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entity/message.entity';
import { Repository } from 'typeorm';
import { AddMessageDto } from '../dto/sendMessage.dto';
import { UserService } from 'src/user/service/user.service';
import { RoomService } from './room.service';
import { WsException } from '@nestjs/websockets';

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
      const author = await this.userService.userRepo.findOneBy({
        id: message.authorId,
      });

      if (!author) {
        throw new WsException('User not exist');
      }

      const room = await this.roomService.roomRepo.findOneBy({
        id: message.roomId,
      });

      if (!room) {
        throw new WsException('Room not exist');
      }
      const newMessage: Message = { text: message.text, room, author };

      this.messageRepository.save(newMessage);
    } catch (err) {
      throw err;
    }
  }

  // loadMessageForRoom(){}
}
