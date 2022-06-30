import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loc } from '../../../db/entities/loc.entity.js';
import { LocData } from '../../../db/entities/locData.entity.js';
import { Resource } from '../../../db/entities/resource.entity.js';
import { ResourceData } from '../../../db/entities/resourceData.entity.js';
import { User } from '../../../db/entities/user.entity.js';
import AODatabaseMaster from './masters/AODatabaseMaster.js';
import { ResourceEditorRpcController } from './resourceeditor.rpc.controller.js';
import { ResourceEditorRpcService } from './resourceeditor.rpc.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Resource, ResourceData, Loc, LocData]),
  ],
  providers: [ResourceEditorRpcService, AODatabaseMaster],
  controllers: [ResourceEditorRpcController],
})
export class ResourceEditorRpcModule {}
