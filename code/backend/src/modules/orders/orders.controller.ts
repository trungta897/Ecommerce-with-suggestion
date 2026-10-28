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
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, fromEvent, map } from 'rxjs';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RequestReturnDto } from './dto/request-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';
import { RETURN_MAX_EVIDENCE_FILES } from '../../common/constants/order.constant';
import { OrdersService } from './orders.service';
import { OrdersPaymentService } from './orders-payment.service';
import { OrdersReturnService } from './orders-return.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { I18nLang } from 'nestjs-i18n';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ordersPaymentService: OrdersPaymentService,
    private readonly ordersReturnService: OrdersReturnService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(
    @Req() req: Request & { user: { id: string } },
    @Body() createOrderDto: CreateOrderDto,
    @I18nLang() lang: string,
  ) {
    const userId = req.user.id;
    return this.ordersService.createOrder(userId, createOrderDto, lang);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/pay-again')
  async payAgain(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
  ) {
    const userId = req.user.id;
    return this.ordersPaymentService.payAgain(userId, orderId, lang);
  }

  // GUEST ENDPOINTS
  @Post('guest')
  async createGuestOrder(
    @Body() createOrderDto: CreateOrderDto,
    @I18nLang() lang: string,
  ) {
    // Guest orders pass null for userId
    return this.ordersService.createOrder(null, createOrderDto, lang);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('guest/:id/pay-again')
  async payAgainGuest(
    @Param('id') orderId: string,
    @Body('phone') phone: string,
    @I18nLang() lang: string,
  ) {
    return this.ordersPaymentService.payAgainGuest(orderId, phone, lang);
  }

  @Get('guest/:id')
  async getGuestOrderById(
    @Param('id') orderId: string,
    @Query('phone') phone: string,
    @I18nLang() lang: string,
  ) {
    return this.ordersService.getGuestOrderById(orderId, phone, lang);
  }

  @Sse('guest/:id/tracking')
  trackGuestOrder(
    @Param('id') orderId: string,
    @Query('token') token: string,
    @I18nLang() lang: string,
  ): Observable<MessageEvent> {
    this.ordersService.verifyGuestTrackingToken(orderId, token, lang);
    return fromEvent(
      this.ordersService.getEventEmitter(),
      `order.updated.${orderId}`,
    ).pipe(map((payload) => ({ data: payload }) as MessageEvent));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async getMyOrders(
    @Req() req: Request & { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;
    return this.ordersService.getUserOrders(
      userId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getOrderById(
    @Req() req: Request & { user: { id: string; role: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
  ) {
    return this.ordersService.getOrderById(orderId, req.user, lang);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cancel')
  async cancelOrder(
    @Req() req: Request & { user: { id: string; role: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
  ) {
    const staffRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.EMPLOYEE,
    ];
    const isStaff = staffRoles.includes(req.user.role as UserRole);
    return this.ordersService.cancelOrder(orderId, req.user.id, isStaff, lang);
  }

  @UseGuards(AuthGuard('jwt'))
  @Sse(':id/tracking')
  async trackUserOrder(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
  ): Promise<Observable<MessageEvent>> {
    await this.ordersService.verifyOrderOwnership(orderId, req.user.id);
    return fromEvent(
      this.ordersService.getEventEmitter(),
      `order.updated.${orderId}`,
    ).pipe(map((payload) => ({ data: payload }) as MessageEvent));
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @Get('admin')
  async getAdminOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getAdminOrders(
      Number(page) || 1,
      Number(limit) || 10,
      status,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @I18nLang() lang: string,
  ) {
    return await this.ordersService.updateOrderStatus(
      orderId,
      updateOrderStatusDto,
      lang,
    );
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/refund')
  async refundOrder(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
  ) {
    const adminId = req.user.id;
    return this.ordersPaymentService.refundOrder(orderId, adminId, lang);
  }

  // Return Endpoints
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/return/eligibility')
  async checkReturnEligibility(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
  ) {
    return this.ordersReturnService.checkReturnEligibility(
      req.user.id,
      orderId,
      lang,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/return')
  @UseInterceptors(FilesInterceptor('files', RETURN_MAX_EVIDENCE_FILES))
  async requestReturn(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body() dto: RequestReturnDto,
    @I18nLang() lang: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.ordersReturnService.requestReturn(
      req.user.id,
      orderId,
      dto,
      files,
      lang,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/return/evidence')
  @UseInterceptors(FilesInterceptor('files', RETURN_MAX_EVIDENCE_FILES))
  async supplementEvidence(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.ordersReturnService.supplementEvidence(
      req.user.id,
      orderId,
      files,
      lang,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @Post(':id/return/approve')
  async approveReturn(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @I18nLang() lang: string,
  ) {
    return this.ordersReturnService.approveReturn(orderId, req.user.id, lang);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @Post(':id/return/reject')
  async rejectReturn(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body() dto: RejectReturnDto,
    @I18nLang() lang: string,
  ) {
    return this.ordersReturnService.rejectReturn(
      orderId,
      req.user.id,
      dto,
      lang,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/refund/force-reset')
  async forceResetRefundStatus(
    @Req() req: Request & { user: { id: string } },
    @Param('id') orderId: string,
    @Body('reason') reason: string,
    @I18nLang() lang: string,
  ) {
    const adminId = req.user.id;
    return this.ordersPaymentService.forceResetRefundStatus(
      orderId,
      adminId,
      reason,
      lang,
    );
  }
}
