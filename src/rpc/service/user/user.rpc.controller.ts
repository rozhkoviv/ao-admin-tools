import { Controller } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import { IAccount } from './interfaces/account.interface.js';
import { IAccountAccess } from './interfaces/accountaccess.interface.js';
import { IAccountDetails } from './interfaces/accountdetails.interface.js';
import { IAccountInfo } from './interfaces/accountinfo.interface.js';
import { IRPCState } from './interfaces/rpcstate.interface.js';
import { UserRpcService } from './user.rpc.service.js';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class UserRpcController {
  constructor(private userService: UserRpcService) {}

  @GrpcMethod('UserService', 'createAccount')
  async createAccount(details: IAccountDetails): Promise<IRPCState> {
    await this.userService.createAccount(details);
    return { state: 'success' };
  }

  @GrpcMethod('UserService', 'getAccountInfo')
  async getAccountInfo(account: IAccount): Promise<IAccountInfo> {
    const res = await this.userService.getAccountInfo(account);
    return {
      login: res.login,
      accessLevel: res.access,
      canLogin: res.can_logIn,
    };
  }

  @GrpcMethod('UserService', 'setAccess')
  async setAccess(access: IAccountAccess): Promise<IRPCState> {
    await this.userService.setAccess(access);
    return {
      state: 'success',
    };
  }

  @GrpcMethod('UserService', 'changePassword')
  async changePassword(details: IAccountDetails): Promise<IRPCState> {
    await this.userService.changePassword(details);
    return {
      state: 'success',
    };
  }

  @GrpcMethod('UserService', 'disableAccount')
  async disableAccount(account: IAccount): Promise<IRPCState> {
    await this.userService.disableAccount(account);
    return {
      state: 'success',
    };
  }

  @GrpcMethod('UserService', 'enableAccount')
  async enableAccount(account: IAccount): Promise<IRPCState> {
    await this.userService.enableAccount(account);
    return {
      state: 'success',
    };
  }
}
