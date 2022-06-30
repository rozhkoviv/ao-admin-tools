import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from '../../db/entities/type.entity';

@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(Type) private typeRepository: Repository<Type>,
  ) {}

  async getTypeInfoByName(typeName: string) {
    const typeInfo = await this.typeRepository.findOne({
      where: [
        {
          typeName: typeName,
        },
        {
          serverTypeName: typeName,
        },
      ],
    });
    if (typeInfo) {
      return typeInfo;
    } else throw new NotFoundException('Type not found');
  }

  async getTypeResources(typeName: string) {
    const type = await this.getTypeInfoByName(typeName);
    return await type.resources;
  }
}
