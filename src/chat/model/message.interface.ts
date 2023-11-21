import { User } from 'src/user/model/user.interface';
import { Room } from './room.interface';

export interface Message {
  id?: number;
  text: string;
  author: User;
  room: Room;
  createAt: Date;
  updatedAt: Date;
}
