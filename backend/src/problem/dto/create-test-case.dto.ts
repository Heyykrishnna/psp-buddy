import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsInt } from 'class-validator';

export class CreateTestCaseDto {
  @IsString()
  @IsOptional()
  problemId?: string;

  @IsString()
  @IsOptional()
  questionId?: string;

  @IsString()
  @IsNotEmpty()
  input!: string;

  @IsString()
  @IsNotEmpty()
  expectedOutput!: string;

  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}
