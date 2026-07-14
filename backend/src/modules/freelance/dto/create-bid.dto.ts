// freelance/dto/create-bid.dto.ts
import { IsString, IsNumber, IsNotEmpty, Min, Max, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export class CreateBidDto {
  @ApiProperty({ description: 'Bid amount', example: 750 })
  @IsNumber()
  @Min(0)
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @ApiProperty({ description: 'Timeline in days', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  timelineDays!: number;

  @ApiProperty({
    description: 'Cover letter',
    example: 'I have 5 years of experience in React Native...',
  })
  @IsString()
  @IsNotEmpty()
  coverLetter!: string;
}
