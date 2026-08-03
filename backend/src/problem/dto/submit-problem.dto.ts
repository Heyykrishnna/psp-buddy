import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SubmitProblemDto {
  @IsString()
  @IsNotEmpty()
  sourceCode!: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  // Memory limit override (capped server-side to EXECUTION_LIMITS.MAX_MEMORY_MB)
  @IsNumber()
  @IsOptional()
  @Min(16)
  @Max(256)
  memoryLimitMb?: number;
}
