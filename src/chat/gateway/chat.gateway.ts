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
import { UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { ConnectedUserService } from '../service/connected-user.service';
import { MessageService } from '../service/message.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { broadcast } from '../helper/broadcast';
import { RoomConnectionService } from '../service/room-connection.service';
import { MessageEntity } from '../entity/message.entity';
import { RoomEntity } from '../entity/room.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { RoomConnectionEntity } from '../entity/joined-room.entity';
import { ConnectedUserEntity } from '../entity/connected-user.entity';
import { ROOM_PAGINATION_LIMIT } from '../constant/paginate.constant';
import { SendSystemMessageDto } from '../dto/send-system-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly connectedUserService: ConnectedUserService,
    private readonly roomConnectionService: RoomConnectionService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    // TODO clean up all previous connected instances from database.

    client.use(async (req, next) => {
      const socket = req as unknown as Socket;
      let decoded;

      try {
        const token = await this.authService.verifyJwt(
          this.authService.getJwtFromSocket(socket),
        );
        decoded = token;
        if (!token) {
          throw new Error('no token');
        }
      } catch (error) {
        console.log(error);
        next();
      }

      try {
        const user: User = await this.userService.findOneById(decoded.user.id);
        if (!user) {
          throw new Error('User not found');
        }
      } catch (error) {
        console.log(error);
        next();
      }
      next();
    });
  }

  async handleConnection(socket: Socket) {
    let user;
    try {
      const decodedToken = await this.authService.verifyJwt(
        this.authService.getJwtFromSocket(socket),
      );

      user = await this.userService.findOneById(decodedToken.user.id);

      if (!user) {
        socket.emit('Error', new UnauthorizedException());
        socket.disconnect();
      } else {
        socket.data.user = user;

        const rooms = await this.roomService.findRoomForUser(user.id, {
          limit: ROOM_PAGINATION_LIMIT,
          page: 1,
        });

        await this.connectedUserService.addOne(socket.id, user);
        this.server
          .to(socket.id)
          .emit('broadcast', broadcast('initialization', 'Rooms loaded'));

        this.server.to(socket.id).emit('receiveUserRooms', rooms);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async handleDisconnect(socket: Socket) {
    await this.connectedUserService.deleteBySocketId(socket.id);
    await this.roomConnectionService.disconnectAllRoom(socket.id);

    console.log('Disconnected');
  }

  @SubscribeMessage('createRoom')
  async onCreateRoom(
    @ConnectedSocket()
    client: Socket,
    @MessageBody()
    createRoomDto: CreateRoomDto,
  ) {
    let newRoom;
    let sessions;
    try {
      newRoom = await this.roomService.createRoom(
        createRoomDto,
        client.data.user,
      );

      sessions = await this.connectedUserService.findByInUserIds(
        newRoom.users.map((user) => user.id),
      );
    } catch (error) {
      throw new WsException(error);
    }

    this.server
      .to(
        sessions
          .map((session) => session.socketId)
          .filter((id) => id !== client.id),
      )
      .emit('receiveInvitationNotification', {
        user: client.data.user,
        room: newRoom,
      });

    this.server
      .to(sessions.map((session) => session.socketId))
      .emit('receiveCreatedRoom', newRoom);
  }

  // @UseInterceptors(LoggingInterceptor)
  @SubscribeMessage('selectRoom')
  async viewRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ) {
    let roomWithMessages;

    await Promise.all([
      this.roomConnectionService.disconnectAllRoom(client.id),
      this.roomService.viewRoom(roomId, client.data.user.id),
    ])
      .then((value) => {
        roomWithMessages = value[1];
      })
      .catch((error) => console.log(error));

    try {
      await this.roomConnectionService.connectRoom(
        client.data.user.id,
        client.id,
        roomId,
      );
    } catch (error) {
      console.log(error);
    }

    this.server.to(client.id).emit('receiveSelectedRoom', roomWithMessages);
  }

  @SubscribeMessage('paginateRoom')
  async paginateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() index: number,
  ) {
    const rooms = await this.roomService.findRoomForUser(client.data.user.id, {
      limit: ROOM_PAGINATION_LIMIT,
      page: index,
    });
    console.log(rooms, 'These good paginated rooms');

    this.server.to(client.id).emit('receivePaginatedRoom', rooms);
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: number,
  ) {
    let room: RoomEntity;
    const user = client.data.user as UserEntity;
    try {
      room = await this.roomService.leaveRoom(roomId, user.id);
    } catch (error) {
      console.log(error);
    }
    this.server.to(client.id).emit('receiveLeaveRoomResponse', room);

    // 通知其他同房的用戶該使用者已離開
    let roomConnections: RoomConnectionEntity[];
    try {
      roomConnections = await this.roomConnectionService.findByRoomId(roomId);
    } catch (error) {
      console.log(error);
    }

    // 送訊息存資料庫 然後 emit給client

    let outSent: MessageEntity;
    try {
      const systemMessage: SendSystemMessageDto = {
        authorId: user.id,
        roomId: roomId,
        text: `${user.username} has leaved ${room.name}.`,
        type: 'system',
      };
      outSent = await this.messageService.sendSystemMessage(systemMessage);
    } catch (error) {
      console.log(error);
    }

    this.server
      .to(roomConnections.map((connection) => connection.socketId))
      .emit('receiveSystemMessage', outSent);
  }

  // Todo develop this  part later
  // @SubscribeMessage('joinRoom')
  // async onJoinRoom(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() roomId: number,
  // ) {
  //   const room = await this.roomService.joinRoom(roomId, client.data.user.id);
  //   console.log('ROOOM', room);
  //   this.server.to(client.id).emit('joinRoom', room);
  // }

  @SubscribeMessage('sendMessage')
  async handleAddMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    let createdMessage: MessageEntity;
    let room: RoomEntity;
    let roomConnections: RoomConnectionEntity[];
    let connectedClients: ConnectedUserEntity[];
    await Promise.all([
      this.messageService.sendMessage(data),
      this.roomService.findOneById(data.roomId),
      this.roomConnectionService.findByRoomId(data.roomId),
      this.connectedUserService.findByRoomId(data.roomId),
    ])
      .then(
        (value) =>
          ([createdMessage, room, roomConnections, connectedClients] = value),
      )
      .catch((error) => {
        console.log(error);
      });

    this.server
      .to(connectedClients.map((client) => client.socketId))
      .emit(
        'broadcast',
        `${client.data.user.username} sent a message in ${room.name}`,
      );

    const clientIds = roomConnections.map((connection) => connection.socketId);
    this.server.to(clientIds).emit('receiveNewMessage', createdMessage);
  }

  @SubscribeMessage('sendSystemMessage')
  async handleSendSystem(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendSystemMessageDto,
  ) {
    let room: RoomEntity;
    let createdMessage: MessageEntity;
    let roomConnections: RoomConnectionEntity[];

    await Promise.all([
      this.messageService.sendSystemMessage(data),
      this.roomService.findOneById(data.roomId),
      this.roomConnectionService.findByRoomId(data.roomId),
    ])
      .then((value) => ([createdMessage, room, roomConnections] = value))
      .catch((error) => console.log(error));
    const clientIds = roomConnections.map((connection) => connection.socketId);
    this.server.to(clientIds).emit('receiveSystemMessage', createdMessage);
  }
}
