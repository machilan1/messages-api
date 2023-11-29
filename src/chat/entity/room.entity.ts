import { UserEntity } from 'src/user/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { RoomConnectionEntity } from './joined-room.entity';

@Entity()
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => MessageEntity, (message) => message.room)
  messages: MessageEntity[];

  @ManyToMany(() => UserEntity, (user) => user.rooms)
  users: UserEntity[];

  @OneToMany(
    () => RoomConnectionEntity,
    (roomConnection) => roomConnection.room,
  )
  connectingUsers: UserEntity[];
}
