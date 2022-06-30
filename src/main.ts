import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module.js';
import { join } from 'path';
import { Transport } from '@nestjs/microservices';

const APP_PORT = process.env.PORT || 3000;
const RPC_HOST = process.env.RPC_HOST || 'localhost';
const RPC_PORT = process.env.RPC_PORT || 50050;

async function bootstrap() {
  const app = await NestFactory.create(MainModule);

  app.setGlobalPrefix('api');

  // connecting grpc service
  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      url: `${RPC_HOST}:${RPC_PORT}`,
      package: 'rpc',
      protoPath: join(__dirname, './protos/RPCService.proto'),
    },
  });
  await app.startAllMicroservices();
  await app.listen(APP_PORT);
}

bootstrap();
