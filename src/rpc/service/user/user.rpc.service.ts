import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as grpc from '@grpc/grpc-js';
import { User } from '../../../db/entities/user.entity.js';
import { IAccount } from './interfaces/account.interface.js';
import { IAccountDetails } from './interfaces/accountdetails.interface.js';
import { RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { IAccountAccess } from './interfaces/accountaccess.interface.js';
import { Role } from '../../../auth/role.enum.js';

@Injectable()
export class UserRpcService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createAccount(details: IAccountDetails) {
    try {
      const newUser = new User();
      newUser.login = details.login;
      newUser.password = details.password;
      const role = Role[details.accessLevel];
      if (!role)
        throw new RpcException({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'No such role!',
        });
      newUser.access = role;

      await this.userRepository.save([newUser]);
    } catch (error) {
      throw new RpcException({
        code: grpc.status.ALREADY_EXISTS,
        message: 'Account already exists',
      });
    }
  }

  async getAccountInfo(account: IAccount) {
    const user = await this.userRepository.findOne({
      where: { login: account.login },
    });
    if (!user)
      throw new RpcException({
        code: grpc.status.NOT_FOUND,
        message: 'Account not found',
      });
    return user;
  }

  async changePassword(details: IAccountDetails) {
    const user = await this.userRepository.findOne({
      where: { login: details.login },
    });
    if (!user)
      throw new RpcException({
        code: grpc.status.NOT_FOUND,
        message: 'Account not found',
      });

    user.password = details.password;
    user.password_hash = user.password;
    const res = await this.userRepository.save(user);
    if (res) return true;
    else
      throw new RpcException({
        code: grpc.status.INTERNAL,
        message: 'Error while changing password!',
      });
  }

  async disableAccount(account: IAccount) {
    const user = await this.userRepository.findOne({
      where: {
        login: account.login,
      },
    });

    if (!user)
      throw new RpcException({
        code: grpc.status.NOT_FOUND,
        message: 'Account not found',
      });

    user.can_logIn = false;
    const res = await this.userRepository.save(user);
    if (res) return true;
    else
      throw new RpcException({
        code: grpc.status.INTERNAL,
        message: 'Error while disabling account!',
      });
  }

  async enableAccount(account: IAccount) {
    const user = await this.userRepository.findOne({
      where: {
        login: account.login,
      },
    });

    if (!user)
      throw new RpcException({
        code: grpc.status.NOT_FOUND,
        message: 'Account not found',
      });

    user.can_logIn = true;
    const res = await this.userRepository.save(user);
    if (res) return true;
    else
      throw new RpcException({
        code: grpc.status.INTERNAL,
        message: 'Error while disabling account!',
      });
  }

  async setAccess(accountAccess: IAccountAccess) {
    const user = await this.userRepository.findOne({
      where: {
        login: accountAccess.login,
      },
    });

    if (!user)
      throw new RpcException({
        code: grpc.status.NOT_FOUND,
        message: 'Account not found',
      });

    const newRole = Role[accountAccess.accessLevel];
    if (!newRole)
      throw new RpcException({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'No such role!',
      });

    user.access = newRole;
    const res = await this.userRepository.save(user);
    if (res) return true;
    else
      throw new RpcException({
        code: grpc.status.INTERNAL,
        message: 'Error while changing access level!',
      });
  }
}
