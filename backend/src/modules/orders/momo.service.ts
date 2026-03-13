import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { Order } from './entities/order.entity';

@Injectable()
export class MomoService {
  async createPaymentUrl(order: Order) {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

    // Kiểm tra biến môi trường để tránh lỗi khi deploy
    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      throw new InternalServerErrorException(
        'Cấu hình MoMo chưa đầy đủ trong file .env',
      );
    }

    const requestId = partnerCode + new Date().getTime();
    const orderId = order.orderNumber;
    const orderInfo = `Thanh toán đơn hàng ${order.orderNumber}`;
    // Đảm bảo amount là số nguyên và chuyển thành string
    const amount = Math.round(Number(order.totalAmount)).toString();
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey as string)
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
      const response = await axios.post(endpoint as string, requestBody);

      if (response.data.resultCode !== 0) {
        console.error('MoMo Error:', response.data);
        return null; // Hoặc quăng lỗi để Controller xử lý
      }

      return response.data.payUrl;
    } catch (error: any) {
      console.error('Lỗi khi kết nối MoMo:', error.message);
      return null;
    }
  }
}
