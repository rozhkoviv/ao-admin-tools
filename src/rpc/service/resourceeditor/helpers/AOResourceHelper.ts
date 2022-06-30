import * as path from 'path';
import * as AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as yauzl from 'yauzl';
import { AOPakHelper } from './AOPakHelper';
import { RpcException } from '@nestjs/microservices';
import { PakResource } from './Types';

const pakNames = [
  'XDB_Mechanics.Server.pak',
  'XDB_Items.Server.pak',
  'XDB_SFX.Server.pak',
  'XDB_Maps.Server.pak',
  'XDB_Mods.Server.pak',
  'XDB_Ships.Server.pak',
  'XDB_World.Server.pak',
  'XDB_Client.Server.pak',
  'XDB_Spells.Server.pak',
  'XDB_Material.Server.pak',
  'XDB_Creatures.Server.pak',
  'XDB_Interface.Server.pak',
  'XDB_Characters.Server.pak',
];

type XDBPak = {
  rootDir: string;
  resources: PakResource[];
};

export default class AOResourceHelper {
  private paksDir: string;
  paks: AOPakHelper[] = [];

  constructor(paksDir: string) {
    this.paksDir = paksDir;
  }

  loadPacks = () =>
    new Promise((res, rej) => {
      Promise.all(
        pakNames.map(
          (pakName) =>
            new Promise((resolve, reject) => {
              const pakHelper = new AOPakHelper(
                path.resolve(this.paksDir, pakName),
              );
              pakHelper
                .loadEntries()
                .catch((err) => reject(err))
                .then(() => {
                  this.paks.push(pakHelper);
                  resolve(true);
                });
            }),
        ),
      )
        .then(() => res(true))
        .catch((err) => rej(err));
    });

  /*loadPacks = () =>
    new Promise((res, rej) => {
      this.paks = [];
      Promise.all(
        pakNames.map(
          (pakName) =>
            new Promise((resolve, reject) => {
              try {
                yauzl.open(
                  path.resolve(this.paksDir, pakName),
                  { lazyEntries: true },
                  (err, pak: yauzl.ZipFile) => {
                    if (err) rej(err);

                    if (pak) {
                      const resources: PakResource[] = [];

                      pak.readEntry();
                      pak.on('entry', (entry: yauzl.Entry) => {
                        pak.openReadStream(entry, (error, resourceStream) => {
                          let resourceData: Buffer = null;
                          resourceStream.on('end', () => {
                            resources.push({
                              path: entry.fileName,
                              data: resourceData,
                            });
                            if (pak.isOpen) pak.readEntry();
                          });

                          resourceStream.on('data', (chunk: Buffer) => {
                            resourceData = chunk;
                          });
                        });
                      });
                      pak.once('end', () => {
                        this.paks.push({
                          rootDir: pakName,
                          resources: resources,
                        });
                        pak.close();
                        resolve(true);
                      });
                    } else resolve(true);
                  },
                );
              } catch (error) {
                rej(error);
              }
            }),
        ),
      ).then(() => res(true));
    });*/

  private async resolvePakPath(resourcePath: string) {
    const rootFoler = resourcePath.substring(0, resourcePath.indexOf('/'));
    if (rootFoler === 'ItemMall' || rootFoler === 'System') {
      return rootFoler;
    }
    return `XDB_${rootFoler}.Server.pak`;
  }

  async readResource(resourcePath: string) {
    let realPath = resourcePath;
    if (realPath.startsWith('/')) realPath = realPath.substring(1);
    const pakPath = await this.resolvePakPath(realPath);
    if (pakPath.startsWith('XDB')) {
      /*const resourceData = this.paks
        .find((pakInfo) => pakInfo.rootDir === pakPath)
        ?.resources.find((resInfo) => resInfo.path === realPath)?.data;*/
      const resourceData = await this.paks
        .find((pak) => pak.getPakName() === pakPath)
        ?.readResource(realPath);
      if (resourceData) {
        return resourceData;
      }
    } else {
      const resourceData = fs.readFileSync(
        path.resolve(this.paksDir, '../', realPath),
      );
      if (resourceData) return resourceData;
    }

    return undefined;
  }

  async writeResourceData(path: string, data: Buffer) {
    return undefined;
  }

  async createResource(path: string, data: Buffer) {
    return undefined;
  }

  async deleteResource(path: string) {
    return undefined;
  }
}
