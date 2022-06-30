import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Loc } from './loc.entity.js';
import { User } from './user.entity.js';

@Entity('locData')
export class LocData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  region: string;

  @Column('bytea')
  text: Buffer;

  @Column('boolean')
  isRelease: boolean;

  @ManyToOne(() => Loc, (loc) => loc.data)
  loc: Loc;

  @ManyToOne(() => User, (user) => user.locFiles)
  user: User;
}
