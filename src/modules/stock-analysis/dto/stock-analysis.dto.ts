import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StockDataDto {
  @ApiProperty({ description: 'Giá cổ phiếu' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Khối lượng giao dịch' })
  @IsNumber()
  volume: number;

  @ApiProperty({ description: 'Chỉ số P/E' })
  @IsNumber()
  pe: number;

  @ApiProperty({ description: 'Chỉ số P/B' })
  @IsNumber()
  pb: number;

  @ApiProperty({ description: 'EPS - Thu nhập trên mỗi cổ phiếu' })
  @IsNumber()
  eps: number;

  @ApiProperty({ description: 'ROE - Tỷ suất sinh lời trên vốn chủ sở hữu' })
  @IsNumber()
  roe: number;
}

export class HistoricalDataPointDto {
  @ApiProperty({ description: 'Ngày giao dịch' })
  @IsString()
  date: string;

  @ApiProperty({ description: 'Giá đóng cửa' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Khối lượng giao dịch' })
  @IsNumber()
  volume: number;
}

export class HistoricalDataDto {
  @ApiProperty({
    type: [HistoricalDataPointDto],
    description: 'Dữ liệu lịch sử giá',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoricalDataPointDto)
  historical_prices: HistoricalDataPointDto[];
}

export class MarketDataDto {
  @ApiProperty({ description: 'Chỉ số thị trường' })
  @IsNumber()
  market_index: number;

  @ApiProperty({
    description: 'Xu hướng thị trường',
    enum: ['upward', 'downward', 'sideways'],
  })
  @IsEnum(['upward', 'downward', 'sideways'])
  market_trend: string;

  @ApiProperty({ description: 'Hiệu suất các ngành' })
  @IsObject()
  sector_performance: Record<string, string>;
}

export enum RiskProfile {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
