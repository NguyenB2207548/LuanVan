import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { GetStatsQueryDto } from './dto/get-stats-query.dto';

@Injectable()
export class StatisticsService {
  exportAdminGlobalReport(
    res: globalThis.Response,
    startDate: string | undefined,
    endDate: string | undefined,
  ) {
    throw new Error('Method not implemented.');
  }
  constructor(private dataSource: DataSource) {}

  async getSellerDashboard(sellerId: number, query: GetStatsQueryDto) {
    const { startDate, endDate } = query;

    // 1. Thống kê tổng quát (Doanh thu, Đơn hàng)
    const generalStatsQuery = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.status = :status', { status: 'delivered' });

    if (startDate && endDate) {
      generalStatsQuery.andWhere(
        'order.created_at BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const stats = await generalStatsQuery
      .select('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .getRawOne();

    // 2. Doanh thu theo thời gian (Biểu đồ)
    // Lưu ý: Logic này dùng MySQL DATE_FORMAT, nếu dùng Postgres hãy dùng TO_CHAR
    const chartQuery = this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .select("DATE_FORMAT(order.created_at, '%Y-%m-%d')", 'date')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.status = :status', { status: 'delivered' })
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (startDate && endDate) {
      chartQuery.andWhere('order.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }
    const chartData = await chartQuery.getRawMany();

    // 3. Top 5 sản phẩm bán chạy
    const topProducts = await this.dataSource
      .getRepository(OrderItem)
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoinAndSelect('item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .select('product.productName', 'productName')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .addSelect('SUM(item.priceAtPurchase * item.quantity)', 'revenue')
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.status = :status', { status: 'delivered' })
      .groupBy('product.id')
      .orderBy('totalSold', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      overview: {
        totalRevenue: parseFloat(stats.totalRevenue || 0),
        totalOrders: parseInt(stats.totalOrders || 0),
      },
      chartData: chartData.map((d) => ({
        date: d.date,
        revenue: parseFloat(d.revenue),
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        sold: parseInt(p.totalSold),
        revenue: parseFloat(p.revenue),
      })),
    };
  }

  async exportOrdersToExcel(sellerId: number, res: Response) {
    const orders = await this.dataSource.getRepository(Order).find({
      where: { seller: { id: sellerId } },
      relations: ['items', 'items.variant', 'items.variant.product', 'user'],
      order: { createdAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đơn hàng');

    // Định nghĩa Header
    worksheet.columns = [
      { header: 'Mã đơn hàng', key: 'orderNumber', width: 25 },
      { header: 'Khách hàng', key: 'customer', width: 20 },
      { header: 'Ngày đặt', key: 'createdAt', width: 20 },
      { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Địa chỉ giao hàng', key: 'address', width: 40 },
    ];

    // Thêm dữ liệu
    orders.forEach((order) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        customer: order.user.fullName,
        createdAt: order.createdAt.toLocaleString('vi-VN'),
        totalAmount: order.totalAmount,
        status: order.status,
        address: order.shippingAddress,
      });
    });

    // Định dạng header (tô màu, in đậm)
    worksheet.getRow(1).font = { bold: true };

    // Gửi file về client
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orders-report-${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
