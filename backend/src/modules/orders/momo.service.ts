import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { Order } from './entities/order.entity';

@Injectable()
export class MomoService {
  async createPaymentUrl(order: Order) {
    // Ép kiểu "as string" để báo cho TypeScript biết đây chắc chắn là chuỗi
    const partnerCode = process.env.MOMO_PARTNER_CODE as string;
    const accessKey = process.env.MOMO_ACCESS_KEY as string;
    const secretKey = process.env.MOMO_SECRET_KEY as string;
    const endpoint = process.env.MOMO_ENDPOINT as string;
    const redirectUrl = process.env.MOMO_REDIRECT_URL as string;
    const ipnUrl = process.env.MOMO_IPN_URL as string;

    // Thông tin giao dịch
    const requestId = partnerCode + new Date().getTime();
    const orderId = order.orderNumber;
    const orderInfo = `Thanh toan don hang ${order.orderNumber} tai GiftShop`;
    const amount = Math.round(Number(order.totalAmount)).toString();
    const requestType = 'captureWallet';
    const extraData = '';

    // Tạo chữ ký (Signature)
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey) // Hết báo lỗi nhờ đã có "as string" ở trên
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    try {
      const response = await axios.post(endpoint, requestBody);

      console.log('--- PHẢN HỒI TỪ MOMO ---');
      console.log(response.data);

      if (response.data.resultCode !== 0) {
        throw new Error(`MoMo từ chối giao dịch: ${response.data.message}`);
      }

      return response.data.payUrl;
    } catch (error: any) {
      console.error('Lỗi khi gọi API MoMo:', error.message);
      throw new Error('Không thể tạo cổng thanh toán MoMo lúc này.');
    }
  }
}
