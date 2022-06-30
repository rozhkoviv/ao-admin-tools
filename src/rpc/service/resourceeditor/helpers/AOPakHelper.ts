import * as unzip from 'yauzl';
import * as zip from 'yazl';
import * as path from 'path';
import { RpcException } from '@nestjs/microservices';
import { PakResource } from './Types';

export class AOPakHelper {
  private resources: unzip.Entry[] = [];
  private pakPath: string;
  private pakName: string;
  constructor(pakPath: string) {
    this.pakPath = pakPath;
    this.pakName = path.basename(this.pakPath);
  }

  getPakName() {
    return this.pakName;
  }

  loadEntries = () =>
    new Promise((res, rej) => {
      unzip.open(
        this.pakPath,
        { lazyEntries: true },
        (err, pak: unzip.ZipFile) => {
          if (err) rej(err);

          if (pak) {
            pak.readEntry();
            pak.on('entry', (entry: unzip.Entry) => {
              this.resources.push(entry);
              if (pak.isOpen) pak.readEntry();
            });
            pak.once('end', () => {
              pak.close();
              res(true);
            });
          } else rej('Unable to load pak');
        },
      );
    });

  readResource = (resPath: string) =>
    new Promise((res, rej) => {
      unzip.open(
        this.pakPath,
        { lazyEntries: true },
        (err, pak: unzip.ZipFile) => {
          if (err) rej(err);
          if (pak) {
            const resource = this.resources.find(
              (resource) => resource.fileName === resPath,
            );
            if (resource) {
              pak.openReadStream(resource, (error, resourceStream) => {
                if (error) rej(error);
                const resData: number[] = [];
                resourceStream.on('end', () => {
                  pak.close();
                  res(Buffer.from(resData));
                });
                resourceStream.on('data', (chunk: Buffer) => {
                  resData.push(...chunk);
                });
              });
            } else rej('Unable to find resource');
          } else rej('Unable to load pak');
        },
      );
    });

  readAll = () =>
    new Promise((res, rej) => {
      unzip.open(
        this.pakPath,
        { lazyEntries: true },
        (err, pak: unzip.ZipFile) => {
          if (err) rej(err);
          if (pak) {
            Promise.all(
              this.resources.map(
                (resource) =>
                  new Promise((resolve, reject) => {
                    pak.openReadStream(resource, (error, resourceStream) => {
                      if (error) rej(error);
                      const resData: number[] = [];
                      resourceStream.on('end', () => {
                        resolve(<PakResource>{
                          path: resource.fileName,
                          data: Buffer.from(resData),
                        });
                      });
                      resourceStream.on('data', (chunk: Buffer) => {
                        resData.push(...chunk);
                      });
                    });
                  }),
              ),
            ).then((pakResources: PakResource[]) => res(pakResources));
          } else rej('Unable to load pak');
        },
      );
    });
}
