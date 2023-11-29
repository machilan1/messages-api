import { User } from 'src/user/model/user.interface';
import { Room } from './room.interface';
import { MESSAGE_TYPE } from '../constant/message-type.constant';

export interface Message {
  id?: number;
  text: string;
  author: User;
  room: Room;
  type?: MESSAGE_TYPE;
  createAt?: Date;
}
