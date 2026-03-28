import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class StatisticsService {
  constructor(private readonly dataSource: DataSource) { }

  // ----------------------------------------------------------------
  // HELPER: Tính khoảng thời gian của kỳ trước (để so sánh)
  // Ví dụ: từ/đến là tháng 3, kỳ trước = tháng 2
  // ----------------------------------------------------------------
  private getPreviousPeriod(from: Date, to: Date): { prevFrom: Date; prevTo: Date } {
    const diff = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - diff);
    return { prevFrom, prevTo };
  }

  // ----------------------------------------------------------------
  // 1. TỔNG QUAN DOANH THU
  // Trả về: doanh thu, số đơn, giá trị TB mỗi đơn + so sánh kỳ trước
  // ----------------------------------------------------------------
  async getRevenueOverview(sellerId: number, from: Date, to: Date) {
    const { prevFrom, prevTo } = this.getPreviousPeriod(from, to);

    // Query kỳ hiện tại
    const current = await this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .select('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect(
        `SUM(CASE WHEN order.status = 'success' THEN order.totalAmount ELSE 0 END)`,
        'completedRevenue',
      )
      .addSelect(
        `COUNT(CASE WHEN order.status = 'success' THEN 1 END)`,
        'completedOrders',
      )
      .addSelect(
        `COUNT(CASE WHEN order.status = 'cancelled' THEN 1 END)`,
        'cancelledOrders',
      )
      .addSelect(
        `COUNT(CASE WHEN order.status = 'pending' THEN 1 END)`,
        'pendingOrders',
      )
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne();

    // Query kỳ trước (để tính % thay đổi)
    const previous = await this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .select('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect(
        `SUM(CASE WHEN order.status = 'success' THEN order.totalAmount ELSE 0 END)`,
        'completedRevenue',
      )
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.createdAt BETWEEN :from AND :to', {
        from: prevFrom,
        to: prevTo,
      })
      .getRawOne();

    const currentRevenue = Number(current.completedRevenue) || 0;
    const previousRevenue = Number(previous.completedRevenue) || 0;
    const currentOrders = Number(current.completedOrders) || 0;
    const previousOrders = Number(previous.completedOrders) || 0;

    // Tính % thay đổi
    const revenueChange =
      previousRevenue === 0
        ? null
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const ordersChange =
      previousOrders === 0
        ? null
        : ((currentOrders - previousOrders) / previousOrders) * 100;

    const avgOrderValue =
      currentOrders > 0 ? currentRevenue / currentOrders : 0;

    const prevAvgOrderValue =
      previousOrders > 0 ? previousRevenue / previousOrders : 0;

    const avgOrderChange =
      prevAvgOrderValue === 0
        ? null
        : ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100;

    return {
      period: { from, to },
      current: {
        totalRevenue: currentRevenue,
        completedOrders: currentOrders,
        cancelledOrders: Number(current.cancelledOrders) || 0,
        pendingOrders: Number(current.pendingOrders) || 0,
        avgOrderValue: Math.round(avgOrderValue),
      },
      changes: {
        revenue: revenueChange !== null ? Math.round(revenueChange * 10) / 10 : null,
        orders: ordersChange !== null ? Math.round(ordersChange * 10) / 10 : null,
        avgOrderValue: avgOrderChange !== null ? Math.round(avgOrderChange * 10) / 10 : null,
      },
    };
  }

  // ----------------------------------------------------------------
  // 2. BIỂU ĐỒ DOANH THU THEO THỜI GIAN
  // groupBy: 'day' | 'week' | 'month'
  // Trả về mảng { label, revenue, orders } để vẽ biểu đồ
  // ----------------------------------------------------------------
  async getRevenueChart(
    sellerId: number,
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    // Định nghĩa format group theo DB (MySQL)
    const groupFormat = {
      day: '%Y-%m-%d',
      week: '%Y-%u', // năm-tuần
      month: '%Y-%m',
    }[groupBy];

    const raw = await this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .select(`DATE_FORMAT(order.createdAt, '${groupFormat}')`, 'period')
      .addSelect(
        `SUM(CASE WHEN order.status = 'success' THEN order.totalAmount ELSE 0 END)`,
        'revenue',
      )
      .addSelect(
        `COUNT(CASE WHEN order.status = 'success' THEN 1 END)`,
        'orders',
      )
      .addSelect(
        `COUNT(CASE WHEN order.status = 'cancelled' THEN 1 END)`,
        'cancelled',
      )
      .where('order.seller_id = :sellerId', { sellerId })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    // Format label đẹp hơn cho frontend
    const data = raw.map((row) => {
      let label = row.period;

      if (groupBy === 'day') {
        // '2026-03-28' → '28/03'
        const [y, m, d] = row.period.split('-');
        label = `${d}/${m}`;
      } else if (groupBy === 'month') {
        // '2026-03' → 'T3/2026'
        const [y, m] = row.period.split('-');
        label = `T${parseInt(m)}/${y}`;
      } else if (groupBy === 'week') {
        // '2026-13' → 'Tuần 13'
        const [, w] = row.period.split('-');
        label = `Tuần ${parseInt(w)}`;
      }

      return {
        period: row.period,
        label,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.orders) || 0,
        cancelled: Number(row.cancelled) || 0,
      };
    });

    return {
      groupBy,
      period: { from, to },
      data,
    };
  }
}