import * as crypto from 'crypto';
import { ResourceData } from './resourceData.entity.js';
import { LocData } from './locData.entity.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Role } from '../../auth/role.enum.js';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { unique: true })
  login: string;

  @Column('text')
  password_salt: string;

  password: string;

  @Column('text')
  password_hash: string;

  @Column('text', { default: Role.User })
  access: Role;

  @Column('boolean', { default: true })
  can_logIn: boolean;

  @OneToMany(() => ResourceData, (resourceData) => resourceData.user, {
    lazy: true,
  })
  resources: ResourceData[];

  @OneToMany(() => LocData, (locData) => locData.user)
  locFiles: LocData[];

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword() {
    if (this.password) {
      this.password_salt = crypto.randomBytes(16).toString('hex');
      this.password_hash = crypto
        .pbkdf2Sync(this.password, this.password_salt, 1000, 64, 'sha512')
        .toString('hex');
    }
  }
}
