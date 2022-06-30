import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Type } from './type.entity';

@Entity('enum')
export class Enum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { array: true })
  values: string[];

  @OneToOne(() => Type, (type) => type.enumValues)
  type: Type;
}
