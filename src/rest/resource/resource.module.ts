import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from '../../db/entities/resource.entity';
import { ResourceData } from '../../db/entities/resourceData.entity';
import { User } from '../../db/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, ResourceData, User])],
  providers: [ResourceService],
  controllers: [ResourceController],
})
export class ResourceModule {}
