// freelance/dto/create-freelance-job.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsUUID,
  IsUrl,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum FreelanceJobStatus {
  DRAFT = 'DRAFT',
  FUNDED = 'FUNDED',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export enum PricingType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export class CreateFreelanceJobDto {
  @ApiProperty({ description: 'Job title', example: 'Build a React Native Mobile App' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Job description',
    example: 'We need a mobile app built with React Native...',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ description: 'Minimum budget', example: 500 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMin!: number;

  @ApiProperty({ description: 'Maximum budget', example: 1000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMax!: number;

  @ApiProperty({ enum: PricingType, default: PricingType.FIXED, required: false })
  @IsEnum(PricingType)
  @IsOptional()
  pricingType?: PricingType;

  @ApiProperty({ description: 'Deadline in days', example: 7 })
  @IsNumber()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  deadlineDays!: number;

  @ApiProperty({ type: [String], description: 'Required skills', example: ['React', 'Node.js'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  skills!: string[];

  @ApiProperty({ description: 'Location preference', required: false, example: 'Remote' })
  @IsString()
  @IsOptional()
  locationPreference?: string;

  @ApiProperty({ enum: ExperienceLevel, required: false })
  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

  @ApiProperty({ type: [String], description: 'Attachments', required: false })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  attachments?: string[];
}
