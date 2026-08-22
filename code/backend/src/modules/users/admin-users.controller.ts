import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.getAllUsers(
      Number(page) || 1,
      Number(limit) || 10,
      role,
    );
  }

  @Post('invite')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async inviteStaff(
    @Request() req: { user: { userId: string; role: string } },
    @Body('email') email: string,
    @Body('fullName') fullName: string,
    @Body('role') role: 'ADMIN' | 'EMPLOYEE',
  ) {
    const adminRole = req.user.role;
    return this.usersService.inviteStaff(adminRole, email, fullName, role);
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async changeRole(
    @Request() req: { user: { userId: string; role: string } },
    @Param('id') id: string,
    @Body('role') newRole: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER',
  ) {
    const adminId = req.user.userId;
    const adminRole = req.user.role;
    return this.usersService.changeRole(adminId, adminRole, id, newRole);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async toggleActive(
    @Request() req: { user: { userId: string; role: string } },
    @Param('id') id: string,
  ) {
    const adminId = req.user.userId;
    const adminRole = req.user.role;
    return this.usersService.toggleActive(adminId, adminRole, id);
  }
}
