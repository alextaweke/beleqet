// freelance/dto/create-contract.dto.ts
import { IsUUID, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ description: 'Freelance job ID' })
  @IsUUID()
  freelanceJobId?: string;

  @ApiProperty({ description: 'Client ID' })
  @IsUUID()
  clientId?: string;

  @ApiProperty({ description: 'Freelancer ID' })
  @IsUUID()
  freelancerId?: string;

  @ApiProperty({ description: 'Agreed amount' })
  @IsNumber()
  agreedAmount?: number;
}
