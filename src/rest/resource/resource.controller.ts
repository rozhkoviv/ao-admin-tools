import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import RolesGuard from '../../auth/guard/roles.guard';
import { ResourceService } from './resource.service';

@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get('release/id/:id')
  async getResourceById(@Param('id') id: number) {
    return await this.resourceService.getReleaseResourceById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getUserResources(@Request() req) {
    return await this.resourceService.getUserResources(req.user);
  }

  @Get('path/:path')
  async getResourceByPath(@Param('path') path: string) {
    return await this.resourceService.getResourceByPath(
      path.replace(/[|]/g, '/'),
    );
  }
}
