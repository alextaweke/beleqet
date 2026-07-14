// freelance/dto/create-milestone.dto.ts
import { IsString, IsNumber, IsOptional, IsUUID, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsUUID()
  @IsNotEmpty()
  contractId!: string;

  @ApiProperty({ description: 'Milestone title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Milestone description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Milestone amount' })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Milestone deadline' })
  @IsString()
  @IsNotEmpty()
  deadline!: string;
}
