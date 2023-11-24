import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { RoomService } from '../service/room.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { AuthService } from 'src/auth/service/auth.service';
import { UserService } from 'src/user/service/user.service';
import { User } from 'src/user/model/user.interface';
import {
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConnectedUserService } from '../service/connected-user.service';
import { MessageService } from '../service/message.service';
import { AddMessageDto } from '../dto/send-message.dto';
import { LegitSenderGuard } from 'src/auth/guards/user-identity.guard';
import { In } from 'typeorm';
import { broadcast } from '../helper/broadcast';
import { ConnectedUserEntity } from '../entity/connected-user.entity';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly connectedUserService: ConnectedUserService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    client.use(async (req, next) => {
      const socket = req as unknown as Socket;
      try {
        console.log(
          socket.handshake.headers.authorization.split(' ')[1],
          'TOKEN',
        );

        console.log(socket.handshake.headers.authorization, 'NO BEARER');
        const token = await this.authService.verifyJwt(
          socket.handshake.headers.authorization.split(' ')[1],
        );

        if (!token) {
          throw new UnauthorizedException();
        }

        const user: User = await this.userService.findOneById(token.user.id);

        if (!user) {
          throw new UnauthorizedException();
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  }

  async handleConnection(socket: Socket) {
    console.log('Connected');
    try {
      const decodedToken = await this.authService.verifyJwt(
        socket.handshake.headers.authorization.split(' ')[1],
      );

      const user: User = await this.userService.findOneById(
        decodedToken.user.id,
      );

      if (!user) {
        socket.emit('Error', new UnauthorizedException());
        socket.disconnect();
      } else {
        socket.data.user = user;
        const rooms = await this.roomService.getRoomForUser(user.id, {
          limit: 10,
          page: 1,
        });

        await this.connectedUserService.connectedUserRepo.save({
          socketId: socket.id,
          user: user,
        });

        return this.server.to(socket.id).emit('rooms', rooms);
      }
    } catch (error) {
      throw error;
    }
  }

  async handleDisconnect(socket: Socket) {
    let unremoved = true;

    while (unremoved) {
      await this.connectedUserService.deleteBySocketId(socket.id);
      const session = await this.connectedUserService.findOneBySocketId(
        socket.id,
      );

      if (!session) unremoved = false;
    }

    console.log('Disconnected');
  }

  @SubscribeMessage('sendMessage')
  async handleAddMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AddMessageDto,
  ) {
    const createdMessage = await this.messageService.sendMessage(data);
    const roomName = (await this.roomService.getOneById(data.roomId)).name;
    const participants = await this.roomService.getParticipants(data.roomId);

    const broadcastSocketIds = (
      await this.connectedUserService.findManyByInUserIds(
        participants.map((user) => user.id),
      )
    ).map((session) => session.socketId);

    this.server
      .to(broadcastSocketIds)
      .emit(
        'broadcast',
        `${client.data.user.username} sent a message in ${roomName}`,
      );

    return this.server.to(client.id).emit('sendMessage', createdMessage);
  }

  @SubscribeMessage('createRoom')
  async onCreateRoom(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    createRoomDto: CreateRoomDto,
  ) {
    // 創建新聊天室的實例
    const newRoom = await this.roomService.createRoom(
      createRoomDto,
      client.data.user,
    );

    // 對聊天室內受邀用戶發出通知
    const sessions: ConnectedUserEntity[] =
      await this.connectedUserService.findManyByInUserIds(
        newRoom.users.map((user) => user.id),
      );

    this.server
      .to(
        sessions
          .map((session) => session.socketId)
          .filter((id) => id !== client.id),
      )
      .emit(
        'broadcast',
        broadcast(
          'createRoom',
          `${client.data.user.username} invites you to a room.`,
        ),
      );

    return newRoom;
  }

  // @SubscribeMessage('joinRoom')
  // async onJoinRoom(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() roomId: number,
  // ) {
  //   let sessions: ConnectedUserEntity[];

  //   try {
  //     const userIds = (
  //       await this.roomService.getParticipants(roomId)
  //     ).users.map((user) => user.id);

  //     sessions = await this.connectedUserService.findManyByInUserIds(userIds);
  //   } catch (error) {}

  //   const roomWithMessages = await this.roomService.joinRoom(
  //     roomId,
  //     client.data.user.id,
  //   );

  //   this.server
  //     .to(
  //       sessions
  //         .map((session) => session.socketId)
  //         .filter((socketId) => socketId !== client.id),
  //     )
  //     .emit('joinRoom', roomWithMessages);
  //   this.server
  //     .to([client.id])
  //     .emit(
  //       'broadcast',
  //       broadcast('joinRoom', `${client.data.user.name} has joined in`),
  //     );
  // }

  // @SubscribeMessage('leaveRoom')
  // async onLeaveRoom(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() roomId: number,
  // ) {
  //   const { name } = await this.roomService.leaveRoom(
  //     roomId,
  //     client.data.user.id,
  //   );
  //   this.server.emit(
  //     'broadcast',
  //     broadcast('leaveRoom', `${client.data.user.name} has leaved ${name}`),
  //   );
  // }

  @SubscribeMessage('viewRoom')
  async viewRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ) {
    const roomWithMessages = await this.roomService.viewRoom(
      roomId,
      client.data.user.id,
    );
    this.server.to(client.id).emit('viewRoom', roomWithMessages);
  }
}
