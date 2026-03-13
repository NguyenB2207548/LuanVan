import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalRequest,
  RequestStatus,
} from './entities/approval-request.entity';
import { Repository, DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private approvalRepo: Repository<ApprovalRequest>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async approveRequest(requestId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await this.approvalRepo.findOne({
        where: { id: requestId },
        relations: ['user'],
      });

      if (!request || request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Yêu cầu không hợp lệ');
      }

      // 1. Cập nhật trạng thái Request
      request.status = RequestStatus.APPROVED;
      await queryRunner.manager.save(request);

      // 2. Cập nhật User kèm thông tin chuyên biệt
      const user = request.user;
      user.role = request.requestedRole;

      if (request.requestedRole === UserRole.SELLER) {
        user.shopName = request.shopName;
      } else if (request.requestedRole === UserRole.SHIPPER) {
        user.vehiclePlate = request.vehiclePlate;
      }

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      return { message: 'Duyệt thành công, User đã có quyền mới' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // 1. Tạo yêu cầu mới
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

  // 2. Lấy danh sách chờ duyệt
  async findAllPending() {
    return this.approvalRepo.find({
      where: { status: RequestStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // 3. Cập nhật trạng thái (Dùng cho Approve hoặc Reject)
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

    // Nếu là REJECTED: Chỉ cần cập nhật trạng thái đơn giản
    if (status === RequestStatus.REJECTED) {
      request.status = RequestStatus.REJECTED;
      return this.approvalRepo.save(request);
    }

    // Nếu là APPROVED: Phải dùng Transaction để cập nhật cả 2 bảng
    if (status === RequestStatus.APPROVED) {
      return this.approveRequestTransaction(request);
    }
  }

  // Hàm bổ trợ xử lý Transaction cho việc Approve
  private async approveRequestTransaction(request: ApprovalRequest) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // BƯỚC 1: Cập nhật trạng thái yêu cầu
      request.status = RequestStatus.APPROVED;
      await queryRunner.manager.save(request);

      // BƯỚC 2: Nâng cấp thông tin User
      const user = request.user;
      user.role = request.requestedRole;

      if (request.requestedRole === UserRole.SELLER) {
        user.shopName = request.shopName;
      } else if (request.requestedRole === UserRole.SHIPPER) {
        user.vehiclePlate = request.vehiclePlate;
      }

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      return { message: 'Phê duyệt thành công và đã nâng cấp quyền hạn.' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Có lỗi xảy ra trong quá trình phê duyệt.');
    } finally {
      await queryRunner.release();
    }
  }
}
