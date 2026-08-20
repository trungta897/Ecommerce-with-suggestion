import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VNPay,
  ignoreLogger,
  HashAlgorithm,
  ReturnQueryFromVNPay,
} from 'vnpay';

@Injectable()
export class VnPayService {
  private readonly vnpayInstance: VNPay;
  private readonly logger = new Logger(VnPayService.name);

  constructor(private readonly configService: ConfigService) {
    const tmnCode =
      this.configService.get<string>('VNPAY_TMN_CODE') || 'sandbox';
    const secureSecret =
      this.configService.get<string>('VNPAY_HASH_SECRET') || 'sandbox';

    this.vnpayInstance = new VNPay({
      tmnCode,
      secureSecret,
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512' as HashAlgorithm,
      enableLog: true,
      loggerFn: ignoreLogger,
    });
  }

  createPaymentUrl(
    orderId: string,
    amount: number,
    ipAddr: string,
    txnId: string,
  ): string {
    const returnUrl =
      this.configService.get<string>('VNPAY_RETURN_URL') ||
      'http://localhost:3000/checkout/callback';

    return this.vnpayInstance.buildPaymentUrl({
      vnp_Amount: amount, // The library vnpay expects standard currency value and multiplies by 100 internally
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_ReturnUrl: returnUrl,
    });
  }

  verifyIpn(query: ReturnQueryFromVNPay) {
    try {
      const verifyResult = this.vnpayInstance.verifyIpnCall(query);
      return verifyResult;
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error(`IPN Verify Error: ${errorMessage}`);
      return { isSuccess: false, message: errorMessage };
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  refund(
    orderId: string,
    amount: number,
    vnp_TxnRef: string,
    vnp_TransactionDate: string,
  ): Promise<boolean> {
    // VNPay Refund logic
    throw new BadRequestException('Refund not implemented in mock');
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
