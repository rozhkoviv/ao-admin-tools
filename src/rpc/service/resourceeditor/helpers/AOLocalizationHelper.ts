import * as fs from 'fs';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as yauzl from 'yauzl';
import * as yazl from 'yazl';
import { zip } from 'rxjs';
import { AOPakHelper } from './AOPakHelper';
import { LocResources, PakResource } from './Types';
import { resolve } from 'path/posix';

type LangPak = {
  locale: string;
  pak: AOPakHelper;
};

export default class AOLocalizationHelper {
  private langPaksDir: string;
  private locPaks: LangPak[] = [];
  constructor(langPaksDir: string) {
    this.langPaksDir = langPaksDir;
  }

  test = async (pakPath: string) => {
    if (pakPath === 'rus_old.pak') {
      console.log(path.resolve(this.langPaksDir, pakPath));
      const newZip = new yazl.ZipFile();
      newZip.outputStream
        .pipe(
          fs.createWriteStream(
            path.resolve(this.langPaksDir, 'rus_generated.pak'),
          ),
        )
        .on('close', () => {
          console.log('generated!');
        });
      yauzl.open(
        path.resolve(this.langPaksDir, pakPath),
        { lazyEntries: true },
        (err, zip) => {
          if (err) console.error(err);
          zip.readEntry();
          zip.on('entry', (entry: yauzl.Entry) => {
            if (!entry.fileName.endsWith('/')) {
              let zipValue: Buffer = null;
              zip.openReadStream(entry, (err, readStream) => {
                readStream.on('end', () => {
                  newZip.addBuffer(zipValue, entry.fileName);
                  zip.readEntry();
                });
                readStream.on('data', (chunk: Buffer) => {
                  zipValue = chunk;
                });
              });
            } else zip.readEntry();
          });
          zip.once('end', () => {
            newZip.end();
          });
        },
      );
    }
    return true;
  };

  loadIfLocPak = (pakPath: string) =>
    new Promise((res, rej) => {
      try {
        yauzl.open(
          path.resolve(this.langPaksDir, pakPath),
          { lazyEntries: true },
          (err, pak) => {
            if (err) res(false);

            if (pak) {
              pak.readEntry();
              pak.on('entry', (entry: yauzl.Entry) => {
                if (entry.fileName === 'Client/ApplicationName.txt') {
                  pak.close();
                  this.locPaks.push({
                    locale: pakPath.substring(0, pakPath.indexOf('.')),
                    pak: new AOPakHelper(
                      path.resolve(this.langPaksDir, pakPath),
                    ),
                  });
                  res(true);
                }
                if (pak.isOpen) pak.readEntry();
              });

              pak.once('end', () => res(false));
            } else res(false);
          },
        );
      } catch (error) {
        console.log(error);
        res(false);
      }
    });

  loadLocResources = () =>
    new Promise((res, rej) => {
      fs.readdir(this.langPaksDir, (error, files) => {
        if (error) rej(error);
        Promise.all(
          files.map(
            (file) =>
              new Promise((resolve, reject) => {
                fs.stat(
                  path.resolve(this.langPaksDir, file),
                  (error, stats) => {
                    if (error) rej(error);
                    if (!stats.isDirectory()) {
                      this.loadIfLocPak(file).then(() => resolve(true));
                    } else resolve(false);
                  },
                );
              }),
          ),
        )
          .then(() =>
            Promise.all(
              this.locPaks.map(
                (locPak) =>
                  new Promise((resolve, reject) => {
                    locPak.pak
                      .loadEntries()
                      .then(() => locPak.pak.readAll())
                      .then((pakResources: PakResource[]) => {
                        resolve(<LocResources>{
                          region: locPak.locale,
                          resources: pakResources,
                        });
                      });
                  }),
              ),
            ),
          )
          .then((locPaks: LocResources[]) => res(locPaks));
      });
    });
}
