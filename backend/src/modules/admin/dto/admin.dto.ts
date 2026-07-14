// admin/dto/admin.dto.ts
import { IsString, MinLength, IsBoolean, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveDisputeDto {
  @ApiProperty({
    description: 'Resolution message for the dispute',
    example: 'The freelancer has been paid 50% and the contract is terminated.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Resolution must be at least 10 characters' })
  resolution!: string;
}

export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspension',
    required: false,
    example: 'Violation of terms of service',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ReactivateUserDto {
  @ApiProperty({
    description: 'Reason for reactivation',
    required: false,
    example: 'User has resolved the issue',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AdminUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ enum: ['ADMIN', 'EMPLOYER', 'JOB_SEEKER', 'FREELANCER'] })
  role!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  _count?: {
    applications: number;
    bids: number;
    freelanceJobs: number;
  };
}

export class DisputeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ type: [String] })
  evidenceUrls!: string[];

  @ApiProperty({ required: false })
  resolution?: string;

  @ApiProperty({ required: false })
  resolvedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  contract!: {
    id: string;
    freelanceJobId: string;
    clientId: string;
    freelancerId: string;
    agreedAmount: number;
    currency: string;
    status: string;
    freelanceJob: {
      id: string;
      title: string;
      description: string;
    };
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    freelancer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}
