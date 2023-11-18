import { Entity, Column } from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ConnectedUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  socketId: string;
}
