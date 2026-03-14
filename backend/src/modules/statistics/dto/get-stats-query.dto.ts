import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum GroupBy {
  DAY = 'day',
  MONTH = 'month',
}

export class GetStatsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy = GroupBy.DAY;
}
