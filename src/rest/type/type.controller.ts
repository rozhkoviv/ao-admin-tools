import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import RolesGuard from '../../auth/guard/roles.guard';
import { TypeService } from './type.service';

@Controller('type')
export class TypeController {
  constructor(private readonly typeService: TypeService) {}

  @Get(':name')
  @UseGuards(JwtAuthGuard)
  async getTypeInfoByName(@Param('name') name: string) {
    const res = await this.typeService.getTypeInfoByName(name);
    return res;
  }

  @Get('res/:name')
  @UseGuards(JwtAuthGuard)
  async getTypeResources(@Param('name') name: string) {
    return await this.typeService.getTypeResources(name);
  }
}
