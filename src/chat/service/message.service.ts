import { Injectable } from '@nestjs/common';
import { Message } from '../model/message.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from '../entity/message.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  async sendMessage(message: Message) {
    const createdMessage = await this.messageRepository.save(message);
  }

  // loadMessageForRoom(){}
}
