import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LocData } from './locData.entity.js';

@Entity('loc')
export class Loc {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  path: string;

  @Column('text')
  name: string;

  @OneToMany(() => LocData, (locData) => locData.loc)
  data: LocData[];
}
