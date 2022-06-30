import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/db.module.js';
import { RPCModule } from './rpc/rpc.module.js';
import { ResourceModule } from './rest/resource/resource.module';
import { TypeModule } from './rest/type/type.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
    DatabaseModule,
    RPCModule,
    ResourceModule,
    TypeModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
