import { IsNotEmpty } from 'class-validator';
import { UserEntity } from 'src/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoomEntity } from './room.entity';

@Entity()
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNotEmpty()
  @Column()
  text: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  @JoinColumn()
  author: UserEntity;

  @ManyToOne(() => RoomEntity, (room) => room.messages)
  @JoinColumn()
  room: RoomEntity;
}
