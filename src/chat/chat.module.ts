import { Module } from '@nestjs/common';
import { RoomService } from './service/room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from './entity/room.entity';
import { ChatController } from './chat.controller';
import { ChatGateway } from './gateway/chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { ConnectedUserService } from './service/connected-user.service';
import { ConnectedUserEntity } from './entity/connected-user.entity';
import { MessageEntity } from './entity/message.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { MessageService } from './service/message.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomEntity,
      ConnectedUserEntity,
      MessageEntity,
      UserEntity,
    ]),
    AuthModule,
    UserModule,
  ],
  providers: [RoomService, ChatGateway, ConnectedUserService, MessageService],
  controllers: [ChatController],
})
export class ChatModule {}
