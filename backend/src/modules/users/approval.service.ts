import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApprovalRequest,
  RequestStatus,
} from './entities/approval-request.entity';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { SellerProfile } from './entities/seller-profile.entity';
import {
  ShipperProfile,
  ShipperWorkStatus,
} from './entities/shipper-profile.entity';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @InjectRepository(ApprovalRequest)
    private approvalRepo: Repository<ApprovalRequest>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) { }

  // Lấy toàn bộ danh sách (All)
  async findAll() {
    return this.approvalRepo.find({
      relations: ['user'],
      order: {
        status: 'ASC', // PENDING thường đứng trước Approved/Rejected
        createdAt: 'DESC',
      },
    });
  }

  // Lấy danh sách chờ duyệt (Pending)
  async findAllPending() {
    return this.approvalRepo.find({
      where: { status: RequestStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Tạo yêu cầu mới
  async create(userId: number, createDto: CreateApprovalRequestDto) {
    const existingRequest = await this.approvalRepo.findOne({
      where: {
        user: { id: userId },
        status: RequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Bạn đã có một yêu cầu đang chờ xử lý.');
    }

    const newRequest = this.approvalRepo.create({
      userId,
      ...createDto,
    });

    return this.approvalRepo.save(newRequest);
  }

  // Cập nhật trạng thái (Dùng chung cho Duyệt và Từ chối)
  async updateStatus(requestId: number, status: RequestStatus) {
    const request = await this.approvalRepo.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu phê duyệt.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Yêu cầu này đã được xử lý trước đó.');
    }

    if (status === RequestStatus.REJECTED) {
      request.status = RequestStatus.REJECTED;
      return this.approvalRepo.save(request);
    }

    if (status === RequestStatus.APPROVED) {
      return this.executeApproveTransaction(request);
    }
  }

  // Hàm xử lý Transaction phê duyệt (Gom nhóm từ 2 hàm cũ của bạn)
  private async executeApproveTransaction(request: ApprovalRequest) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cập nhật trạng thái yêu cầu
      request.status = RequestStatus.APPROVED;
      await queryRunner.manager.save(request);

      // 2. Cập nhật Role của User
      const user = request.user;
      user.role = request.requestedRole;
      await queryRunner.manager.save(user);

      // 3. Khởi tạo Profile tương ứng
      if (request.requestedRole === UserRole.SELLER) {
        const sellerProfile = queryRunner.manager.create(SellerProfile, {
          userId: user.id,
          shopName: request.shopName,
          shopAddress: request.shopAddress || 'Chưa cập nhật',
          contactNumber: user.phoneNumber,
          rating: 5.0,
        });
        await queryRunner.manager.save(sellerProfile);
      }
      else if (request.requestedRole === UserRole.SHIPPER) {
        const shipperProfile = queryRunner.manager.create(ShipperProfile, {
          userId: user.id,
          vehiclePlate: request.vehiclePlate,
          address: request.shipperAddress, // Đã đổi vehicleType -> shipperAddress
          workStatus: ShipperWorkStatus.READY,
          totalOrdersCompleted: 0,
        });
        await queryRunner.manager.save(shipperProfile);
      }

      await queryRunner.commitTransaction();

      return {
        message: `Phê duyệt thành công. User "${user.fullName}" hiện là ${user.role.toUpperCase()}.`,
        role: user.role,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Lỗi Transaction Phê Duyệt: ${err.message}`, err.stack);

      if (err.code === '23505') {
        throw new ConflictException(
          'Dữ liệu hồ sơ bị trùng lặp (Biển số xe hoặc tên shop đã tồn tại)',
        );
      }
      throw new InternalServerErrorException('Có lỗi xảy ra trong quá trình phê duyệt');
    } finally {
      await queryRunner.release();
    }
  }

  // Giữ lại hàm này nếu bạn vẫn muốn gọi trực tiếp từ Controller mà không qua updateStatus
  async approveRequest(requestId: number) {
    return this.updateStatus(requestId, RequestStatus.APPROVED);
  }
}