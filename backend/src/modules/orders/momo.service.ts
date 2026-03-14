import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { Order } from './entities/order.entity';
@Injectable()
export class MomoService {
  async createPaymentUrl(params: {
    amount: number;
    orderIds: number[];
    orderInfo?: string;
  }) {
    const { amount, orderIds, orderInfo } = params;

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      throw new InternalServerErrorException('Cấu hình MoMo chưa đầy đủ');
    }

    // MoMo cần một orderId duy nhất cho mỗi giao dịch
    // Ta dùng ID của đơn hàng đầu tiên kết hợp với timestamp để tạo mã giao dịch duy nhất
    const requestId = `REQ-${orderIds[0]}-${Date.now()}`;
    const momoOrderId = `TRANS-${orderIds[0]}-${Date.now()}`;
    const info =
      orderInfo || `Thanh toán cho các đơn hàng: ${orderIds.join(', ')}`;
    const amountStr = Math.round(amount).toString();
    const requestType = 'captureWallet';

    // Gửi mảng orderIds vào extraData dưới dạng base64 hoặc string để khi IPN gọi lại ta biết đơn nào đã thanh toán
    const extraData = Buffer.from(JSON.stringify({ orderIds })).toString(
      'base64',
    );

    // QUAN TRỌNG: Thứ tự các tham số phải đúng tuyệt đối theo tài liệu MoMo
    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amountStr}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${info}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      requestId,
      amount: amountStr,
      orderId: momoOrderId,
      orderInfo: info,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    try {
      const response = await axios.post(endpoint, requestBody);
      if (response.data.resultCode !== 0) {
        throw new Error(response.data.message);
      }
      return response.data.payUrl;
    } catch (error) {
      console.error(
        'Momo Payment Error:',
        error.response?.data || error.message,
      );
      return null;
    }
  }
}
