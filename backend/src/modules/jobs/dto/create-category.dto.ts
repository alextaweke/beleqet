import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateJobCategoryDto {
  @ApiProperty({ example: 'Engineering', description: 'The name of the category' })
  @IsString()
  label?: string;

  @ApiProperty({ example: 'engineering', description: 'URL friendly string' })
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'briefcase-icon' })
  @IsString()
  @IsOptional()
  icon?: string;
}
