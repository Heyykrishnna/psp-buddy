import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { DifficultyLevel } from '@/types';

export class CreateProblemDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

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

  @IsInt()
  @IsOptional()
  timeLimitMs?: number;

  @IsInt()
  @IsOptional()
  memoryLimitMb?: number;

  @IsInt()
  @IsOptional()
  points?: number;
}
