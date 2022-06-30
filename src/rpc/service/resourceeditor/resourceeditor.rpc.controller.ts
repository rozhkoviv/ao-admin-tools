import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as grpc from '@grpc/grpc-js';
import { IBuildDatabaseInfo } from './interfaces/builddatabaseinfo.interface.js';
import { IREInfo } from './interfaces/reinfo.interface.js';
import AODatabaseMaster from './masters/AODatabaseMaster.js';
import { ResourceEditorRpcService } from './resourceeditor.rpc.service.js';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { IAuthRoles } from './interfaces/authroles.interface.js';
import { IRPCState } from '../user/interfaces/rpcstate.interface.js';

@Controller()
export class ResourceEditorRpcController {
  constructor(private reService: ResourceEditorRpcService) {}

  @GrpcMethod('ResourceEditorService', 'buildDatabase')
  async buildDatabase(
    dbInfo: IBuildDatabaseInfo,
  ): Promise<Observable<IREInfo>> {
    const dbWorker = new AODatabaseMaster(this.reService);
    return new Observable<IREInfo>((stream) => {
      dbWorker.subscribe('data', (data: any) => stream.next(data));
      dbWorker.subscribe('error', (error: object) => {
        stream.error(new RpcException(error));
      });
      dbWorker.subscribe('complete', () => stream.complete());
      dbWorker.subscribe('cancelled', () => stream.unsubscribe());
      dbWorker
        .buildDatabase(dbInfo, (killAction) => stream.add(() => killAction()))
        .catch(() => {
          if (!stream.closed) {
            stream.error(
              new RpcException({
                code: grpc.status.UNKNOWN,
                message: 'UNKNOWN server error!',
              }),
            );
          }
        });
    });
  }
}
