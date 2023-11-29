import { IsNotEmpty, IsString } from 'class-validator';
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
import { MESSAGE_ENUM, MESSAGE_TYPE } from '../constant/message-type.constant';
import { MESSAGES } from '@nestjs/core/constants';

@Entity()
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNotEmpty()
  @Column()
  text: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'enum', enum: MESSAGE_ENUM, default: MESSAGE_ENUM.MESSAGE })
  type: string;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  @JoinColumn()
  author: UserEntity;

  @ManyToOne(() => RoomEntity, (room) => room.messages)
  @JoinColumn()
  room: RoomEntity;
}
