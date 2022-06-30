import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../auth/role.enum';
import { Resource } from '../../db/entities/resource.entity';
import { ResourceData } from '../../db/entities/resourceData.entity';
import { User } from '../../db/entities/user.entity';

@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectRepository(ResourceData)
    private resourceDataRepository: Repository<ResourceData>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getReleaseResourceById(id: number) {
    const res = await this.resourceRepository.findOne({
      where: {
        resourceId: id,
      },
    });
    if (res) {
      const sysUser = await this.userRepository.findOne({
        where: {
          access: Role.System,
        },
      });
      if (!sysUser) throw new NotFoundException('System user not found');

      const data = await this.resourceDataRepository.findOne({
        where: {
          resource: res,
          user: sysUser,
        },
      });
      if (!data) throw new NotFoundException('Release data not found');
      res.data = [data];
      await res.type;
      return res;
    } else throw new NotFoundException('Resource not found');
  }

  async getUserResources(user: User) {
    const resources = await user.resources;
    if (!resources) return [];
    return Promise.all(
      resources.map(async (resData) => {
        const res = await resData.resource;
        const type = await res.type;
        return {
          verId: resData.id,
          lastEdit: resData.updatedAt,
          resourceId: res.resourceId,
          resourceType: type.typeName,
          path: res.path,
        };
      }),
    );
  }

  async getResourceByPath(path: string) {
    const res = await this.resourceRepository.findOne({
      where: {
        path: path,
      },
    });
    if (res) {
      await res.data;
      await res.type;
      return res;
    } else throw new NotFoundException('Resource not found');
  }
}
