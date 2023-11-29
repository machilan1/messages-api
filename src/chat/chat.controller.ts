import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  Query,
  Get,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomService } from './service/room.service';
import { Room } from './model/room.interface';
import { JwtService } from '@nestjs/jwt';
import { CheckParticipantDto } from './dto/check-participant.dto';

@Controller('room')
export class ChatController {
  constructor(
    private readonly roomService: RoomService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('create')
  async create(
    @Body() room: CreateRoomDto,
    @Request() req: Request,
  ): Promise<Room> {
    const decoded = await this.jwtService.verifyAsync(
      req.headers.get('authorization'),
    );
    return this.roomService.createRoom(room, decoded.user);
  }

  @Get('checkParticipant')
  async check(@Query() data: { userId: string; roomId: string }) {
    let participants;
    try {
      participants = await this.roomService.findParticipants(+data.roomId);
    } catch (error) {
      return false;
    }
    return participants.map((user) => user.id).includes(+data.userId);
  }
}
