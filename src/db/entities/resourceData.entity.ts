import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Resource } from './resource.entity.js';
import { User } from './user.entity.js';

@Entity('resourceData')
export class ResourceData {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Resource, (resource) => resource.data, { lazy: true })
  resource: Resource;

  @Column('json')
  data: string;

  @Column('boolean')
  isRelease: boolean;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updatedAt: Date;

  @ManyToOne(() => User, (user) => user.resources)
  user: User;
}
