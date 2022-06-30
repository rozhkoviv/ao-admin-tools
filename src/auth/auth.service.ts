import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../db/entities/user.entity';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

const passToHash = (password: string, salt: string) =>
  crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(login: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { login: login },
    });

    if (user) {
      const passHash = passToHash(password, user.password_salt);
      if (passHash === user.password_hash && user.can_logIn) return user;
    }

    return null;
  }

  async login(user: User) {
    const payload = { username: user.login, sub: user.id };
    return {
      login: user.login,
      access_token: this.jwtService.sign(payload),
      access_level: user.access,
    };
  }
}
