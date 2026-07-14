// freelance/dto/update-bid.dto.ts
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BidStatus } from './create-bid.dto';

export class UpdateBidDto {
  @ApiProperty({ enum: BidStatus, required: false })
  @IsEnum(BidStatus)
  @IsOptional()
  status?: BidStatus;
}
