import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Request,
  Get,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RequestReturnDto } from './dto/request-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';
import { RETURN_MAX_EVIDENCE_FILES } from '../../common/constants/order.constant';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(
    @Req() req: Request & { user: { id: string } },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const userId = req.user.id;
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/pay-again')
  async payAgain(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
  ) {
    const userId = req.user.id;
    return this.ordersService.payAgain(userId, orderId);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/refund')
  async refundOrder(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
  ) {
    const adminId = req.user.id;
    return this.ordersService.refundOrder(orderId, adminId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/force-confirm')
  async forceConfirmPayment(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.forceConfirmPayment(req.user.id, orderId, reason);
  }

  // Return Endpoints
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/return/eligibility')
  async checkReturnEligibility(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
  ) {
    return this.ordersService.checkReturnEligibility(req.user.id, orderId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/return')
  @UseInterceptors(FilesInterceptor('files', RETURN_MAX_EVIDENCE_FILES))
  async requestReturn(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body() dto: RequestReturnDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.ordersService.requestReturn(req.user.id, orderId, dto, files);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/return/evidence')
  @UseInterceptors(FilesInterceptor('files', RETURN_MAX_EVIDENCE_FILES))
  async supplementEvidence(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.ordersService.supplementEvidence(req.user.id, orderId, files);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/return/approve')
  async approveReturn(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
  ) {
    return this.ordersService.approveReturn(orderId, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/return/reject')
  async rejectReturn(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body() dto: RejectReturnDto,
  ) {
    return this.ordersService.rejectReturn(orderId, req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/refund/force-reset')
  async forceResetRefundStatus(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body('reason') reason: string,
  ) {
    const adminId = req.user.id;
    return this.ordersService.forceResetRefundStatus(orderId, adminId, reason);
  }
}
