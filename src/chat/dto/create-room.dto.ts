import { User } from 'src/user/model/user.interface';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  users: User[];
}
