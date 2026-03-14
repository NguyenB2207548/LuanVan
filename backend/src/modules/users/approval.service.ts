import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
import { SellerProfile } from './entities/seller-profile.entity';
import {
  ShipperProfile,
  ShipperWorkStatus,
} from './entities/shipper-profile.entity';

@Injectable()
export class ApprovalService {
  logger: any;
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
      const request = await queryRunner.manager.findOne(ApprovalRequest, {
        where: { id: requestId },
        relations: ['user'],
      });

      if (!request || request.status !== RequestStatus.PENDING) {
        throw new BadRequestException(
          'Yêu cầu không hợp lệ hoặc đã được xử lý',
        );
      }

      const user = request.user;

      request.status = RequestStatus.APPROVED;
      await queryRunner.manager.save(request);

      user.role = request.requestedRole;
      await queryRunner.manager.save(user);

      if (request.requestedRole === UserRole.SELLER) {
        const newSellerProfile = queryRunner.manager.create(SellerProfile, {
          userId: user.id,
          shopName: request.shopName,
          shopAddress: request.shopAddress || 'Chưa cập nhật',
          businessLicense: request.businessLicense ?? undefined,
          contactNumber: request.user.phoneNumber ?? undefined,
          status: 'active',
          rating: 5.0,
        });
        await queryRunner.manager.save(newSellerProfile);
      } else if (request.requestedRole === UserRole.SHIPPER) {
        const newShipperProfile = queryRunner.manager.create(ShipperProfile, {
          userId: user.id,
          vehiclePlate: request.vehiclePlate ?? undefined,
          vehicleType: 'motorcycle',
          workStatus: ShipperWorkStatus.READY,
        });
        await queryRunner.manager.save(newShipperProfile);
      }

      await queryRunner.commitTransaction();

      return {
        message: `Phê duyệt thành công. User "${user.fullName}" hiện là ${user.role.toUpperCase()}.`,
        role: user.role,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Lỗi phê duyệt request ${requestId}: ${err.message}`,
        err.stack,
      );

      if (err.code === '23505') {
        throw new ConflictException(
          'Dữ liệu hồ sơ bị trùng lặp (Biển số xe hoặc tên shop đã tồn tại)',
        );
      }

      throw new InternalServerErrorException(
        'Có lỗi xảy ra trong quá trình phê duyệt hồ sơ',
      );
    } finally {
      await queryRunner.release();
    }
  }

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

  async findAllPending() {
    return this.approvalRepo.find({
      where: { status: RequestStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  private async approveRequestTransaction(request: ApprovalRequest) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      request.status = RequestStatus.APPROVED;
      await queryRunner.manager.save(request);

      const user = request.user;
      user.role = request.requestedRole;
      await queryRunner.manager.save(user);

      if (request.requestedRole === UserRole.SELLER) {
        const sellerProfile = queryRunner.manager.create(SellerProfile, {
          userId: user.id,
          shopName: request.shopName,
          shopAddress: request.shopAddress || 'Chưa cập nhật',
          businessLicense: request.businessLicense ?? undefined,
          contactNumber: request.user.phoneNumber ?? undefined,
          status: 'active',
          // rating: request.rating ?? 5.0,
        });
        await queryRunner.manager.save(sellerProfile);
      } else if (request.requestedRole === UserRole.SHIPPER) {
        const shipperProfile = queryRunner.manager.create(ShipperProfile, {
          userId: user.id,
          vehiclePlate: request.vehiclePlate ?? undefined,
          vehicleType: request.vehicleType ?? 'motorcycle',
          workStatus: ShipperWorkStatus.READY,
        });
        await queryRunner.manager.save(shipperProfile);
      }

      await queryRunner.commitTransaction();
      return {
        message: `Đã phê duyệt và khởi tạo hồ sơ ${user.role} thành công.`,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Lỗi Transaction Phê Duyệt: ${err.message}`, err.stack);
      throw new BadRequestException(
        'Không thể phê duyệt. Vui lòng kiểm tra lại dữ liệu hồ sơ (trùng biển số xe hoặc tên shop).',
      );
    } finally {
      await queryRunner.release();
    }
  }

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
      return this.approveRequestTransaction(request);
    }
  }
}
