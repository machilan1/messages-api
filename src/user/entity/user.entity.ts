import { ConnectedUserEntity } from 'src/chat/entity/connected-user.entity';
import { RoomConnectionEntity } from 'src/chat/entity/joined-room.entity';
import { MessageEntity } from 'src/chat/entity/message.entity';
import { RoomEntity } from 'src/chat/entity/room.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => MessageEntity, (message) => message.author)
  messages: MessageEntity[];

  @ManyToMany(() => RoomEntity, (room) => room.users)
  @JoinTable()
  rooms: RoomEntity[];

  @OneToMany(() => ConnectedUserEntity, (connected) => connected.user)
  connections: ConnectedUserEntity[];

  @OneToMany(
    () => RoomConnectionEntity,
    (roomConnection) => roomConnection.user,
  )
  connectedRooms: RoomEntity[];
}
