import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ResourceData } from './resourceData.entity.js';
import { Type } from './type.entity.js';

@Entity('resource')
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  path: string;

  @Column('int', { nullable: true, unique: true })
  resourceId: number;

  @ManyToOne(() => Type, (type: Type) => type.resources, { lazy: true })
  type: Type;

  @OneToMany(() => ResourceData, (resourceData) => resourceData.resource, {
    cascade: true,
    lazy: true,
  })
  data: ResourceData[];
}
