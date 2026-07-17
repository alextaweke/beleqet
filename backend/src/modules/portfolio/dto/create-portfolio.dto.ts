import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

// ── PROJECT DTOs ──────────────────────────────────────────────────────────
export class CreateProjectDto {
  @ApiProperty({ description: 'Project title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Project description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Project category' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: 'Project image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Live demo URL' })
  @IsOptional()
  @IsUrl()
  demoUrl?: string;

  @ApiPropertyOptional({ description: 'GitHub repository URL' })
  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Technologies used' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ description: 'Featured project' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Completion date' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

// ── WORK HISTORY DTOs ────────────────────────────────────────────────────
export class CreateWorkHistoryDto {
  @ApiProperty({ description: 'Job title' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  company!: string;

  @ApiPropertyOptional({ description: 'Company website' })
  @IsOptional()
  @IsUrl()
  companyUrl?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Currently working here' })
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Key achievements' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}

// ── TESTIMONIAL DTOs ─────────────────────────────────────────────────────
export class CreateTestimonialDto {
  @ApiProperty({ description: 'User ID (freelancer receiving testimonial)' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Author name' })
  @IsString()
  authorName!: string;

  @ApiPropertyOptional({ description: 'Author role' })
  @IsOptional()
  @IsString()
  authorRole?: string;

  @ApiPropertyOptional({ description: 'Author company' })
  @IsOptional()
  @IsString()
  authorCompany?: string;

  @ApiPropertyOptional({ description: 'Author avatar URL' })
  @IsOptional()
  @IsUrl()
  authorAvatarUrl?: string;

  @ApiProperty({ description: 'Testimonial content' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Rating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Related project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Make public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// ── CERTIFICATION DTOs ───────────────────────────────────────────────────
export class CreateCertificationDto {
  @ApiProperty({ description: 'Certification name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Issuing organization' })
  @IsString()
  issuingOrg!: string;

  @ApiProperty({ description: 'Issue date' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Credential ID' })
  @IsOptional()
  @IsString()
  credentialId?: string;

  @ApiPropertyOptional({ description: 'Credential URL' })
  @IsOptional()
  @IsUrl()
  credentialUrl?: string;

  @ApiPropertyOptional({ description: 'Icon URL' })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;
}

export class UpdatePortfolioItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}

export const PORTFOLIO_CATEGORIES = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Graphic Design',
  'Writing & Translation',
  'Digital Marketing',
  'Video & Animation',
  'Photography',
  'Music & Audio',
  'Business Consulting',
  'Data Analysis',
  'Machine Learning',
  'DevOps',
  'Cloud Architecture',
  'Cybersecurity',
  'Game Development',
  'AR/VR Development',
  'Blockchain Development',
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];
