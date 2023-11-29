import { User } from 'src/user/model/user.interface';
import { IsInt } from 'class-validator';

export class CheckParticipantDto {
  @IsInt()
  userId: number;
  @IsInt()
  roomId: number;
}
