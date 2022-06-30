import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enum } from '../../db/entities/enum.entity';
import { Type } from '../../db/entities/type.entity';
import { TypeField } from '../../db/entities/typeField.entity';
import { TypeController } from './type.controller';
import { TypeService } from './type.service';

@Module({
  imports: [TypeOrmModule.forFeature([Type, TypeField, Enum])],
  controllers: [TypeController],
  providers: [TypeService],
})
export class TypeModule {}
