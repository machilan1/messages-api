import { Body, Controller, Post } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomService } from './service/room.service';
import { Room } from './model/room.interface';

@Controller('room')
export class ChatController {
  constructor(private readonly chatService: RoomService) {}

  // WARNING this should be removed.
  @Post('create')
  async create(@Body() room: CreateRoomDto): Promise<Room> {
    const newRoom = await this.chatService.createRoom(room, {
      email: 'rty@rty.rty',
      id: 1,
      username: 'rtyrty',
    });

    return newRoom;
  }
}
