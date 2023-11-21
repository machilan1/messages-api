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
import { AddMessageDto } from '../dto/sendMessage.dto';
import { LegitSenderGuard } from 'src/auth/guards/user-identity.guard';
import { In } from 'typeorm';

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

        const user: User = await this.userService.userRepo.findOneByOrFail({
          id: token.user.id,
        });

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

      const user: User = await this.userService.userRepo.findOneByOrFail({
        id: decodedToken.user.id,
      });

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
    } catch (e) {
      throw e;
    }
  }

  async handleDisconnect(socket: Socket) {
    let unremoved = true;

    while (unremoved) {
      await this.connectedUserService.connectedUserRepo.delete({
        socketId: socket.id,
      });
      const user = await this.connectedUserService.connectedUserRepo.findOneBy({
        socketId: socket.id,
      });

      if (!user) unremoved = false;
    }

    console.log('Disconnected');
  }

  @UseGuards(LegitSenderGuard)
  @SubscribeMessage('addMessage')
  @UsePipes(
    new ValidationPipe({
      exceptionFactory: (errors) => new WsException(errors),
    }),
  )
  async handleAddMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: AddMessageDto,
  ) {
    const createdMessage = await this.messageService.sendMessage(data);

    return this.server.to(client.id).emit('message', createdMessage);
  }

  @SubscribeMessage('createRoom')
  async onCreateRoom(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    room: CreateRoomDto,
  ) {
    const newRoom = await this.roomService.createRoom(room, client.data.user);

    const sessions: { id: number; socketId: string }[] =
      await this.connectedUserService.connectedUserRepo.findBy({
        user: In(newRoom.users.map((user) => user.id)),
      });

    return this.server
      .to(sessions.map((session) => session.socketId))
      .emit('createRoom', newRoom);
  }
}
