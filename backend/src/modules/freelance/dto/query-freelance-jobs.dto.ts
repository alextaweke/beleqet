// freelance/dto/query-freelance-jobs.dto.ts
import { IsOptional, IsString, IsNumber, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryFreelanceJobsDto {
  @ApiProperty({ description: 'Search query', required: false })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiProperty({ description: 'Category slug', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
