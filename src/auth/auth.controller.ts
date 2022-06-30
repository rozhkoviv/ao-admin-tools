import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { User } from '../db/entities/user.entity';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { LocalAuthGuard } from './guard/local-auth.guard';
import RolesGuard from './guard/roles.guard';
import { Role } from './role.enum';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard, RolesGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Master)
  @Get('test')
  async profile(@Request() req) {
    return {
      state: 'success',
    };
  }
}
