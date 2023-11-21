import { User } from 'src/user/model/user.interface';

export interface Room {
  id?: number;
  name: string;
  description?: string;
  users?: User[];
  createdAt?: Date;
  updatedAt?: Date;
}
