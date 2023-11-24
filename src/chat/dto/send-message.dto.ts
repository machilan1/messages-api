import { IsNotEmpty } from 'class-validator';

export class AddMessageDto {
  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  authorId: number;

  @IsNotEmpty()
  roomId: number;
}
