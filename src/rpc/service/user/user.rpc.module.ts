import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../db/entities/user.entity.js';
import { UserRpcController } from './user.rpc.controller.js';
import { UserRpcService } from './user.rpc.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserRpcService],
  controllers: [UserRpcController],
})
export class UserRpcModule {}
