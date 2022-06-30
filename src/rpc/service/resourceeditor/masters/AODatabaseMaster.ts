import { RpcException } from '@nestjs/microservices';
import { IBuildDatabaseInfo } from '../interfaces/builddatabaseinfo.interface';
import { ProgressAction } from '../interfaces/progressaction.enum';
import { IREInfo } from '../interfaces/reinfo.interface';
import { ResourceEditorRpcService } from '../resourceeditor.rpc.service';
import * as path from 'path';
import { fork } from 'child_process';
import { EventEmitter } from 'stream';
import { EntityManager, getConnection } from 'typeorm';
import { User } from '../../../../db/entities/user.entity';
import { LocResources, TypeInfo, XdbResource } from '../helpers/Types';
import { ResourceData } from '../../../../db/entities/resourceData.entity';
import { Resource } from '../../../../db/entities/resource.entity';
import { Type } from '../../../../db/entities/type.entity';
import { TypeField } from '../../../../db/entities/typeField.entity';
import { Enum } from '../../../../db/entities/enum.entity';
import { Role } from '../../../../auth/role.enum';

export type ChildMessage = {
  type: string;
  value?: IREInfo;
  error?: RpcException;
  rawData?: any;
};

const SERVER_DATA_FOLDER_PATH = '/home/test/projects/ao/server/game/data';

export default class AODatabaseMaster {
  constructor(private resourceEditorService: ResourceEditorRpcService) {}

  private readonly emitter = new EventEmitter();

  subscribe(event: string, subsc: any) {
    return this.emitter.addListener(event, subsc);
  }

  async sendData(data: IREInfo) {
    this.emitter.emit('data', data);
  }

  async sendError(error: object) {
    this.emitter.emit('error', error);
  }

  async sendComplete() {
    this.emitter.emit('complete');
  }

  async sendCancelled() {
    this.emitter.emit('cancelled');
  }

  setSpinner = (info: string, action: ProgressAction) => {
    this.sendData({
      info: info,
      progress: {
        spinner: {
          action: action,
        },
      },
    });
  };

  setProgress = (
    info: string,
    action: ProgressAction,
    max?: number,
    current?: number,
  ) => {
    this.sendData({
      info: info,
      progress: {
        progressBar: {
          action: action,
          max: max,
          current: current,
        },
      },
    });
  };

  // fillDatabase = async (
  //   resources: XdbResource[],
  //   locResources: LocResources[],
  // ) => {
  //   const connection = getConnection();
  //   const queryRunner = connection.createQueryRunner();
  //   await queryRunner.connect();

  //   try {
  //     await queryRunner.startTransaction();
  //     const systemUser = await queryRunner.manager.findOne(User, {
  //       where: {
  //         login: 'system',
  //       },
  //     });
  //     if (!systemUser)
  //       throw new RpcException('System user not found! Create it first!');

  //     resources.forEach((resource) => {
  //       const resData = new ResourceData();
  //       resData.data = resource.data;
  //       resData.isRelease = true;
  //       resData.user = systemUser;

  //       const res = new Resource();
  //       res.data.push(resData);
  //       res.path = resource.path;
  //       res.systemId = resource.resourceId,
  //       res.type =
  //     });
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.sendError(error);
  //   }
  // };

  async insertType(manager: EntityManager, typeInfo: TypeInfo) {
    if (!typeInfo) return true;

    if (!typeInfo.systemType) return true;

    const type = new Type();
    type.typeName = typeInfo.typeName;
    type.serverTypeName = typeInfo.serverTypeName;
    type.systemType = typeInfo.systemType;
    type.baseType = typeInfo.baseType;
    type.description = typeInfo.description;
    type.attributes = typeInfo.attributes;
    type.fields = typeInfo.fields.map((tField) => {
      const typeField = new TypeField();
      typeField.typeName = tField.typeName;
      typeField.name = tField.name;
      typeField.systemType = tField.systemType;
      typeField.type = type;
      typeField.attributes = tField.attributes;
      typeField.description = tField.description;
      typeField.isAbstract = tField.isAbstract;
      typeField.isArray = tField.isArray;

      return typeField;
    });

    if (typeInfo.enumValues) {
      const enumVals = new Enum();
      enumVals.values = typeInfo.enumValues;
      type.enumValues = enumVals;
    }

    const res = await manager.save(type);
    if (!res)
      this.sendError(
        new RpcException(`Error while adding type ${typeInfo.typeName}`),
      );
  }

  async insertResource(manager: EntityManager, resource: XdbResource) {
    if (!resource) return true;

    const resType = await manager.findOne(Type, {
      where: { name: resource.type },
    });

    // if cant find type, skip this resource, because cant edit it
    if (!resType) {
      return false;
    }

    const sysUser = await manager.findOne(User, {
      where: { access: Role.System },
    });
    if (!sysUser) {
      this.sendError(new RpcException('Unable to find SYSTEM user!'));
      return false;
    }

    const resourceData = new ResourceData();
    resourceData.isRelease = true;
    resourceData.user = sysUser;
    resourceData.data = resource.data;

    const resourceEntity = new Resource();
    resourceEntity.path = resource.path;
    resourceEntity.resourceId = Number.parseInt(resource.resourceId);
    resourceEntity.type = resType;
    resourceEntity.data = [];
    resourceEntity.data.push(resourceData);

    const res = await manager.save(resourceEntity);
    if (!res)
      this.sendError(
        new RpcException(`Error while adding resource ${resource.path}`),
      );
  }

  buildDatabase = (
    dbInfo: IBuildDatabaseInfo,
    killAction?: (killAction) => any,
  ) =>
    new Promise((res, rej) => {
      try {
        const aoDbWorker = fork(
          path.resolve(__dirname, 'workers', 'aodb.worker.spawnable.js'),
        );
        ////////////////////
        //  Transaction preparing
        ////////////////////
        const connection = getConnection();

        const queryRunner = connection.createQueryRunner();

        queryRunner.connect().then(() => {
          queryRunner.startTransaction().then(() => {
            try {
              ////////////////////
              //  Subscribe block
              ////////////////////
              killAction(() => {
                aoDbWorker.kill();
                rej();
              });
              aoDbWorker.on('message', (message: ChildMessage) => {
                switch (message.type) {
                  case 'progress':
                    this.setProgress(
                      message.value.info,
                      message.value.progress.progressBar.action,
                      message.value.progress.progressBar.max,
                      message.value.progress.progressBar.current,
                    );
                    break;
                  case 'spinner':
                    this.setSpinner(
                      message.value.info,
                      message.value.progress.spinner.action,
                    );
                    break;
                  case 'info':
                    this.sendData(message.value);
                    break;
                  case 'iterable_start':
                    if (queryRunner.isTransactionActive) {
                      queryRunner
                        .commitTransaction()
                        .then(() => queryRunner.startTransaction())
                        .then(() => aoDbWorker.send({ type: 'allow_start' }));
                    } else
                      queryRunner
                        .startTransaction()
                        .then(() => aoDbWorker.send({ type: 'allow_start' }));
                    break;
                  case 'iterable':
                    if (message.value) this.sendData(message.value);
                    if (message.rawData?.type) {
                      switch (message.rawData.type) {
                        case 'types':
                          this.insertType(
                            queryRunner.manager,
                            message.rawData?.data,
                          )
                            .then(() => aoDbWorker.send({ type: 'next' }))
                            .catch((err) => {
                              throw new RpcException(err);
                            });
                          break;
                        case 'resource':
                          this.insertResource(
                            queryRunner.manager,
                            message.rawData?.data,
                          )
                            .then(() => aoDbWorker.send({ type: 'next' }))
                            .catch((err) => {
                              throw new RpcException(err);
                            });
                        case 'locale':
                          break;
                      }
                    }
                    break;
                  case 'completed':
                    if (queryRunner.isTransactionActive)
                      queryRunner.commitTransaction().then(() => {
                        this.sendComplete();
                        res(true);
                      });
                    else this.sendComplete();
                    res(true);
                    break;
                  case 'error':
                    this.sendError(message.error);
                    break;
                }
              });
              aoDbWorker.on('close', () => {
                if (queryRunner.isTransactionActive)
                  queryRunner.rollbackTransaction();
                this.sendCancelled();
              });
              aoDbWorker.on('error', (err) => {
                if (queryRunner.isTransactionActive)
                  queryRunner.rollbackTransaction();
                this.sendError(err);
              });

              //////////////////////////////////////
              //  Start child prcess (aodb.worker)
              //////////////////////////////////////
              aoDbWorker.send({
                type: 'start',
                dataFolderPath: SERVER_DATA_FOLDER_PATH,
              });
            } catch (error) {
              if (queryRunner.isTransactionActive)
                queryRunner.rollbackTransaction();
              this.sendError(error);
            }
          });
        });
      } catch (error) {
        this.sendError(error);
      }
    });
}
