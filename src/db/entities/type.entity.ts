import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Enum } from './enum.entity.js';
import { Resource } from './resource.entity.js';
import { TypeField } from './typeField.entity.js';

@Entity('type')
export class Type {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { nullable: true })
  typeName: string;

  @Column('text', { nullable: true })
  serverTypeName: string;

  @Column('text', { nullable: true })
  baseType: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text')
  systemType: string;

  @Column('text', { array: true, default: [] })
  attributes: string[];

  @OneToMany(() => TypeField, (typeField) => typeField.type, {
    cascade: true,
    eager: true,
  })
  fields: TypeField[];

  @OneToMany(() => Resource, (resource) => resource.type, { lazy: true })
  resources: Resource[];

  @OneToOne(() => Enum, { cascade: true, eager: true })
  @JoinColumn()
  enumValues: Enum;
}
