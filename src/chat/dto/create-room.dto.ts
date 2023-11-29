import { User } from 'src/user/model/user.interface';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsInt({ each: true })
  userIds: number[];
}
