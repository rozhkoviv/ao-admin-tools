import { Module } from '@nestjs/common';
import { ResourceEditorRpcModule } from './service/resourceeditor/resourceeditor.rpc.module.js';
import { UserRpcModule } from './service/user/user.rpc.module.js';

@Module({
  imports: [UserRpcModule, ResourceEditorRpcModule],
  providers: [],
  controllers: [],
})
export class RPCModule {}
