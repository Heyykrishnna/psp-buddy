import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
}
