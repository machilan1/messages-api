import { UserEntity } from 'src/user/entity/user.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';
import { RoomEntity } from './room.entity';
import { Room } from '../model/room.interface';

@Entity()
export class RoomConnectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  socketId: string;

  @ManyToOne(() => UserEntity, (user) => user.connectedRooms)
  @JoinColumn()
  user: UserEntity;

  @ManyToOne(() => RoomEntity, (room) => room.connectingUsers)
  @JoinColumn()
  room: RoomEntity;
}
