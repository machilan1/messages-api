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
import { IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
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

    // load rooms by user
  }

  async handleDisconnect(socket: Socket) {
    // remove user from connected user table
    await this.connectedUserService.connectedUserRepo.delete({
      socketId: socket.id,
    });

    console.log('Disconnected');
  }

  @SubscribeMessage('addMessage')
  @UseGuards(JwtAuthGuard)
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    // throw new WsException(data);
    return this.server.to(client.id).emit('message', data);
  }

  @SubscribeMessage('createRoom')
  onCreateRoom(socket: Socket, room: CreateRoomDto) {
    this.roomService.createRoom(room, socket.data.user);
  }
}
