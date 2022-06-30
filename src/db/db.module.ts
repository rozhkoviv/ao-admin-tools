import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enum } from './entities/enum.entity.js';
import { Loc } from './entities/loc.entity.js';
import { LocData } from './entities/locData.entity.js';
import { Resource } from './entities/resource.entity.js';
import { ResourceData } from './entities/resourceData.entity.js';
import { Type } from './entities/type.entity.js';
import { TypeField } from './entities/typeField.entity.js';
import { User } from './entities/user.entity.js';

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT) || 5432;
const username = process.env.DB_USER || 'ao_admin';
const password = process.env.DB_PASS || 'allods';
const database = process.env.DB_DATABASE || 'ao_admin_tools';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      entities: [
        Enum,
        Loc,
        LocData,
        Resource,
        ResourceData,
        Type,
        TypeField,
        User,
      ],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
