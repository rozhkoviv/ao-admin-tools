import AOTypesParser from '../../helpers/AOTypesParser';
import { IBuildDatabaseInfo } from '../../interfaces/builddatabaseinfo.interface';
import { ProgressAction } from '../../interfaces/progressaction.enum';
import { IREInfo } from '../../interfaces/reinfo.interface';
import { ChildMessage } from '../AODatabaseMaster';
import * as fs from 'fs';
import * as path from 'path';
import * as convert from 'xml-js';
import * as grpc from '@grpc/grpc-js';
import AOIndexHelper, { IndexResource } from '../../helpers/AOIndexHelper';
import AOResourceHelper from '../../helpers/AOResourceHelper';
import { RpcException } from '@nestjs/microservices';
import AOResourceSerializer from '../../helpers/AOResourceSerializer';
import AOLocalizationHelper from '../../helpers/AOLocalizationHelper';
import { XdbResource, LocResources, TypeInfo } from '../../helpers/Types';

const TYPES_XML_PATH = 'Types/types.xml';
const INDEX_SRV_PATH = 'System/index.srv';
const XDB_PACKS_PATH = 'Packs';
const LOCS_DEFAULT_PATH = 'Packs/Langs';

process.on('message', (message: { type: string; dataFolderPath: string }) => {
  if (message.type === 'start') {
    startAODBWorker(message.dataFolderPath);
  }
});

const setSpinner = async (info: string, action: ProgressAction) => {
  process.send(<ChildMessage>{
    type: 'spinner',
    value: {
      info: info,
      progress: {
        spinner: { action: action },
      },
    },
  });
};

const setProgress = async (
  info: string,
  action: ProgressAction,
  max?: number,
  current?: number,
) => {
  process.send(<ChildMessage>{
    type: 'progress',
    value: {
      info: info,
      progress: {
        progressBar: { action: action, max: max, current: current },
      },
    },
  });
};

const sendError = async (error: object) => {
  process.send({
    type: 'error',
    error: error,
  });
  process.exit();
};

const send = async (info: IREInfo) => {
  process.send(<ChildMessage>{
    type: 'info',
    value: info,
  });
};

const iterableWaitStart = async () => {
  process.send(<ChildMessage>{
    type: 'iterable_start',
    value: undefined,
  });
};

const sendIterable = async (info: IREInfo, data: any) => {
  process.send(<ChildMessage>{
    type: 'iterable',
    value: info,
    rawData: data,
  });
};

const complete = async () => {
  process.send(<ChildMessage>{
    type: 'completed',
  });
  process.exit();
};

const readTypesXml = (rootFolder: string): Promise<AOTypesParser> =>
  new Promise((res, rej) => {
    setSpinner('Reading types.xml', ProgressAction.START);
    setImmediate(() => {
      fs.readFile(
        path.resolve(rootFolder, TYPES_XML_PATH),
        function (err, data) {
          if (err) rej(err);
          if (data === undefined || data.toString === undefined) rej(err);
          try {
            const parser = new AOTypesParser(convert.xml2js(data.toString()));
            res(parser);
          } catch (error) {
            rej(error);
          }
        },
      );
    });
  });

const readIndexSrv = (rootFolder: string): Promise<AOIndexHelper> =>
  new Promise((res, rej) => {
    setSpinner('Reading index.srv', ProgressAction.START);
    setImmediate(() => {
      fs.readFile(
        path.resolve(rootFolder, INDEX_SRV_PATH),
        function (err, data) {
          if (err) rej(err);
          if (data === undefined || data.toString === undefined) rej(err);
          try {
            const parser = new AOIndexHelper(data);
            res(parser);
          } catch (error) {
            rej(error);
          }
        },
      );
    });
  });

const loadAllResources = (
  rootFolder: string,
  indexParser: AOIndexHelper,
): Promise<XdbResource[]> =>
  new Promise((res, rej) => {
    setSpinner('Loading PAKs...', ProgressAction.START);
    setImmediate(() => {
      const resourceWorker = new AOResourceHelper(
        path.resolve(rootFolder, XDB_PACKS_PATH),
      );
      resourceWorker
        .loadPacks()
        .then(() => {
          setProgress(
            'Loading resources...',
            ProgressAction.START,
            indexParser.getCount(),
          );
          const entries = indexParser.getEntries();
          const resources: XdbResource[] = [];
          const readerLoop = () => {
            setImmediate(() => {
              const entry = entries.next();
              if (entry.value) {
                const resPath = entry.value.path;
                resourceWorker
                  .readResource(resPath)
                  .then((data: Buffer | undefined) => {
                    if (data) {
                      const dataAsDBRes = new AOResourceSerializer()
                        .parseXDB(data.toString())
                        .toDatabaseResource();
                      resources.push({
                        path: resPath,
                        resourceId: dataAsDBRes.resourceId,
                        type: dataAsDBRes.typeName,
                        data: JSON.stringify(dataAsDBRes),
                      });
                    } else
                      resources.push({
                        path: resPath,
                        resourceId: undefined,
                        type: undefined,
                        data: undefined,
                      });
                  })
                  .then(() =>
                    setProgress('Loading resources...', ProgressAction.INC),
                  )
                  .then(() => readerLoop());
              } else res(resources);
            });
          };
          readerLoop();
        })
        .catch((err) => rej(err));
    });
  });

const loadLocFiles = (rootFolder: string): Promise<LocResources[]> =>
  new Promise((res, rej) => {
    setSpinner('Loading localizations...', ProgressAction.START);
    setImmediate(() => {
      const locHelper = new AOLocalizationHelper(
        path.resolve(rootFolder, LOCS_DEFAULT_PATH),
      );
      locHelper
        .loadLocResources()
        .then((resources: LocResources[]) => res(resources))
        .catch((err) => rej(err));
    });
  });

const uploadType = (typeInfo: TypeInfo) => {
  setProgress('', ProgressAction.INC);
  sendIterable(undefined, {
    type: 'types',
    data: typeInfo,
  });
};

const uploadResource = (index: IndexResource, resWorker: AOResourceHelper) => {
  resWorker.readResource(index.path).then((data: Buffer | undefined) => {
    setProgress('', ProgressAction.INC);
    if (data) {
      const dataAsDBRes = new AOResourceSerializer()
        .parseXDB(data.toString())
        .toDatabaseResource();
      const resource = <XdbResource>{
        path: index.path,
        resourceId: dataAsDBRes.resourceId,
        type: dataAsDBRes.typeName,
        data: JSON.stringify(dataAsDBRes),
      };
      sendIterable(undefined, {
        type: 'resource',
        data: resource,
      });
    }
  });
};

const controllableProcess = (
  iterable: Generator,
  listener: (value: any) => any,
) =>
  new Promise((res, rej) => {
    const gen = iterable.next();
    if (gen.done) res(true);

    const waitForStart = (message: { type: string }) => {
      if (message.type === 'allow_start') {
        process.off('message', waitForStart);
        process.on('message', messageListener);
        listener(gen.value);
      }
    };
    process.on('message', waitForStart);

    const stopSubscribe = () => {
      process.off('message', messageListener);
      res(true);
    };
    const messageListener = (message: { type: string }) => {
      if (message.type === 'next') {
        const result = iterable.next();
        if (!result.done) {
          listener(result.value);
        } else stopSubscribe();
      }
    };

    iterableWaitStart();
  });

const startAODBWorker = async (dataFolderPath: string) => {
  const rootDir = dataFolderPath;

  const typesParser = await readTypesXml(rootDir).catch((error) =>
    sendError({
      code: grpc.status.INVALID_ARGUMENT,
      message: 'Invalid types.xml path',
    }),
  );

  setProgress(
    'Uploading types to database...',
    ProgressAction.START,
    typesParser.items.length,
  );
  await controllableProcess(typesParser.getIterable(), uploadType);

  const indexParser = await readIndexSrv(rootDir).catch((error) =>
    sendError({
      code: grpc.status.INVALID_ARGUMENT,
      message: 'Invalid index.srv path',
    }),
  );

  setSpinner('Reading PAKs...', ProgressAction.START);
  const resourceWorker = new AOResourceHelper(
    path.resolve(rootDir, XDB_PACKS_PATH),
  );
  await resourceWorker.loadPacks();

  setProgress(
    'Uploading resources to database...',
    ProgressAction.START,
    indexParser.getCount(),
  );
  await controllableProcess(indexParser.getEntries(), (index) =>
    uploadResource(index, resourceWorker),
  );

  /*const resources = await loadAllResources(rootDir, indexParser).catch(
    (error) =>
      sendError({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Error while loading resources from dataPaks',
      }),
  );*/
  /*

  const locResources = await loadLocFiles(rootDir).catch((error) =>
    sendError({
      code: grpc.status.INVALID_ARGUMENT,
      message: 'Error while loading locPaks',
    }),
  );*/

  await setSpinner('Database ready!', ProgressAction.START);
  await complete();
};
