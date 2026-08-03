import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsArray, IsBoolean } from 'class-validator';
import { DifficultyLevel } from '@/types';

export class CreateProblemDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  @IsOptional()
  difficulty?: DifficultyLevel;

  @IsString()
  @IsNotEmpty()
  functionName!: string;

  @IsString()
  @IsNotEmpty()
  starterCodePython!: string;

  @IsString()
  @IsOptional()
  examples?: string;

  @IsString()
  @IsOptional()
  constraints?: string;

  @IsArray()
  @IsOptional()
  topics?: string[];

  @IsInt()
  @IsOptional()
  timeLimitMs?: number;

  @IsInt()
  @IsOptional()
  memoryLimitMb?: number;

  @IsInt()
  @IsOptional()
  points?: number;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
