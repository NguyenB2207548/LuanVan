import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StatisticsService {
  constructor(private readonly dataSource: DataSource) {}

  // ----------------------------------------------------------------
  // HELPER: Tính khoảng thời gian của kỳ trước (để so sánh)
  // Ví dụ: từ/đến là tháng 3, kỳ trước = tháng 2
  // ----------------------------------------------------------------
  private getPreviousPeriod(
    from: Date,
    to: Date,
  ): { prevFrom: Date; prevTo: Date } {
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
        revenue:
          revenueChange !== null ? Math.round(revenueChange * 10) / 10 : null,
        orders:
          ordersChange !== null ? Math.round(ordersChange * 10) / 10 : null,
        avgOrderValue:
          avgOrderChange !== null ? Math.round(avgOrderChange * 10) / 10 : null,
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

  async getAdminOverview() {
    // Đơn hàng
    const orderStats = await this.dataSource.manager
      .createQueryBuilder(Order, 'order')
      .select([
        'COUNT(order.id) AS totalOrders',
        `SUM(CASE WHEN order.status = 'success' THEN order.totalAmount ELSE 0 END) AS totalRevenue`,
      ])
      .getRawOne();

    // Người dùng theo role
    const userStats = await this.dataSource.manager
      .createQueryBuilder(User, 'user')
      .select([
        'COUNT(user.id) AS totalUsers',
        `COUNT(CASE WHEN user.role = 'seller' THEN 1 END) AS totalSellers`,
        `COUNT(CASE WHEN user.role = 'shipper' THEN 1 END) AS totalShippers`,
        `COUNT(CASE WHEN user.role = 'user' THEN 1 END) AS totalCustomers`,
      ])
      .getRawOne();

    // Chờ phê duyệt (seller/shipper đã đăng ký nhưng chưa active)
    // Điều chỉnh điều kiện theo logic approval của bạn
    const pendingApprovals = await this.dataSource.manager
      .createQueryBuilder(User, 'user')
      .where('user.role IN (:...roles)', { roles: ['seller', 'shipper'] })
      .andWhere('user.isActive = :isActive', { isActive: false })
      .getCount();

    return {
      totalOrders: Number(orderStats.totalOrders) || 0,
      totalRevenue: Number(orderStats.totalRevenue) || 0,
      totalUsers: Number(userStats.totalUsers) || 0,
      totalSellers: Number(userStats.totalSellers) || 0,
      totalShippers: Number(userStats.totalShippers) || 0,
      totalCustomers: Number(userStats.totalCustomers) || 0,
      pendingApprovals,
    };
  }

  // ----------------------------------------------------------------
  // 2. BIỂU ĐỒ DOANH THU TOÀN HỆ THỐNG
  // GET /statistics/admin/revenue-chart?from=&to=&groupBy=day|week|month
  // ----------------------------------------------------------------
  async getAdminRevenueChart(
    from: Date,
    to: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const groupFormat = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
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
      // Không filter theo sellerId — lấy toàn bộ hệ thống
      .where('order.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    const data = raw.map((row) => {
      let label = row.period;
      if (groupBy === 'day') {
        const [y, m, d] = row.period.split('-');
        label = `${d}/${m}`;
      } else if (groupBy === 'month') {
        const [y, m] = row.period.split('-');
        label = `T${parseInt(m)}/${y}`;
      } else if (groupBy === 'week') {
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
