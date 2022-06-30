import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, Subject, Subscriber } from 'rxjs';
import { Repository } from 'typeorm';
import { Type } from '../../../db/entities/type.entity.js';
import { TypeField } from '../../../db/entities/typeField.entity.js';
import { User } from '../../../db/entities/user.entity.js';
import { TypeInfo } from './helpers/Types.js';
import { IAuthRoles } from './interfaces/authroles.interface.js';

@Injectable()
export class ResourceEditorRpcService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /*async buildDatabase(dbInfo: IBuildDatabaseInfo, stream: Subscriber<IREInfo>) {
    try {

      
      //===============================================================
      //======================= INDEX.SRV =============================
      //===============================================================
      spinner(stream, {
        info: 'Reading index.srv',
        action: ProgressAction.START,
      });

      const indexSrv = await readFileAsync(
        path.resolve(rootFolder, INDEX_SRV_PATH),
      ).catch(() => {
        throw new RpcException({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Invalid index.srv path',
        });
      });

      if (indexSrv === undefined || indexSrv.toString === undefined) {
        throw new RpcException({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'Invalid types.xml path',
        });
      }

      const indexParser = new AOIndexWorker(indexSrv);

      const test = function* () {
        for (let i = 0; i < 10000000; i++) {
          yield i;
        }
      };

      const resourceWorker = new AOResourceWorker(
        path.resolve(rootFolder, XDB_PACKS_PATH),
      );

      progress(stream, {
        info: 'Reading resources...',
        action: ProgressAction.START,
        max: indexParser.getCount(),
      });

      const indexEntries = indexParser.getEntries();

      let indexEntry = indexEntries.next();

      const ex = () => {
        if (!indexEntry.done) {
          setTimeout(async () => {
            if (indexEntry.value) {
              const resourcePath = indexEntry.value.path;
              await resourceWorker.readResource(resourcePath);
              progress(stream, {
                info: 'Reading resources...',
                action: ProgressAction.INC,
              });
              ex();
            }
          }, 0);
          indexEntry = indexEntries.next();
        }
      };

      const tx = () => {
        if (!indexEntry.done) {
          setTimeout(async () => {
            if (indexEntry.value) {
              const resourcePath = indexEntry.value.path;
              console.log(resourcePath);
              await resourceWorker.readResource(resourcePath);
              progress(stream, {
                info: 'Reading resources...',
                action: ProgressAction.INC,
              });
              ex();
            }
          }, 0);
          indexEntry = indexEntries.next();
        }
      };

      ex();

      tx();

      //stream.complete();
    } catch (error) {
      spinner(stream, {
        info: 'error',
        action: ProgressAction.STOP,
      });
      progress(stream, {
        info: 'error',
        action: ProgressAction.STOP,
      });
      stream.error(error);
    }
  }*/
}
