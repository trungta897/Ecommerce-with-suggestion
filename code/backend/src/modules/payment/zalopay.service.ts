import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';

@Injectable()
export class ZaloPayService {
  private readonly logger = new Logger(ZaloPayService.name);

  constructor(private config: ConfigService) {}

  async createOrder(orderId: string, appTransId: string, amount: number, description: string) {
    const appId = this.config.get<string>('ZALOPAY_APP_ID');
    const key1 = this.config.get<string>('ZALOPAY_KEY1');
    const endpointCreate = this.config.get<string>('ZALOPAY_ENDPOINT_CREATE');
    const redirectUrl = this.config.get<string>('ZALOPAY_REDIRECT_URL');
    const callbackUrl = this.config.get<string>('ZALOPAY_CALLBACK_URL');

    if (!appId || !key1 || !endpointCreate) {
      throw new BadRequestException('ZaloPay config is missing');
    }

    const embedData = JSON.stringify({
      redirecturl: redirectUrl,
    });
    const items = '[]';
    const appTime = Date.now();

    // MAC = HMAC-SHA256(app_id|app_trans_id|app_user|amount|app_time|embed_data|item, key1)
    const rawMac = `${appId}|${appTransId}|${orderId}|${amount}|${appTime}|${embedData}|${items}`;
    const mac = CryptoJS.HmacSHA256(rawMac, key1).toString();

    const payload = {
      app_id: parseInt(appId),
      app_trans_id: appTransId,
      app_user: orderId,
      app_time: appTime,
      amount,
      item: items,
      embed_data: embedData,
      description,
      bank_code: '',
      callback_url: callbackUrl,
      mac,
    };

    try {
      const response = await axios.post(endpointCreate, null, { params: payload });

      if (response.data.return_code !== 1) {
        this.logger.error(`ZaloPay create order error: ${JSON.stringify(response.data)}`);
        throw new BadRequestException(`ZaloPay error: ${response.data.return_message}`);
      }

      return {
        orderUrl: response.data.order_url,
        appTransId,
      };
    } catch (error: any) {
      this.logger.error(`ZaloPay API request failed: ${error.message}`);
      throw new BadRequestException('Failed to connect to ZaloPay');
    }
  }

  verifyCallback(data: string, mac: string): boolean {
    const key2 = this.config.get<string>('ZALOPAY_KEY2');
    if (!key2) return false;
    const expected = CryptoJS.HmacSHA256(data, key2).toString();
    return expected === mac;
  }
}
