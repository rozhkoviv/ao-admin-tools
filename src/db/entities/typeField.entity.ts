import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Type } from './type.entity.js';

@Entity('typeField')
export class TypeField {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Type, (type) => type.fields)
  type: Type;

  @Column('text')
  typeName: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('boolean')
  isAbstract: boolean;

  @Column('boolean')
  isArray: boolean;

  @Column('text', { nullable: true })
  systemType: string;

  @Column('text', { array: true, default: [] })
  attributes: string[];
}
