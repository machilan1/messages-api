import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { MESSAGE_TYPE } from '../constant/message-type.constant';

export class SendMessageDto {
  @IsString()
  @MaxLength(500)
  text: string;

  @IsInt()
  @Min(0)
  @ValidateIf((value) => value >= 0)
  authorId: number;

  @IsInt()
  @Min(0)
  roomId: number;
}
