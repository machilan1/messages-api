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
import { RoomConnectionEntity } from './entity/joined-room.entity';
import { RoomConnectionService } from './service/room-connection.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomEntity,
      ConnectedUserEntity,
      RoomConnectionEntity,
      MessageEntity,
      UserEntity,
    ]),
    AuthModule,
    UserModule,
  ],
  providers: [
    JwtService,
    RoomService,
    ChatGateway,
    ConnectedUserService,
    MessageService,
    RoomConnectionService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
