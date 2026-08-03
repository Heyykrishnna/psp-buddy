import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { DifficultyLevel } from '@/types';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  // 1. POST /problems - Create Problem
  @Post()
  async createProblem(@Body() body: CreateProblemDto) {
    return this.problemService.createProblem(body);
  }

  // 2. GET /problems - List Problems
  @Get()
  async getProblems(
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('search') search?: string,
  ) {
    return this.problemService.getProblems({ difficulty, search });
  }

  // 3. GET /problems/:slugOrId - Get Problem by Slug or ID
  @Get(':slugOrId')
  async getProblemBySlugOrId(@Param('slugOrId') slugOrId: string) {
    return this.problemService.getProblemBySlugOrId(slugOrId);
  }

  // 4. PATCH /problems/:id - Update Problem
  @Patch(':id')
  async updateProblem(
    @Param('id') id: string,
    @Body() body: Partial<CreateProblemDto>,
  ) {
    return this.problemService.updateProblem(id, body);
  }

  // 5. DELETE /problems/:id - Delete Problem
  @Delete(':id')
  async deleteProblem(@Param('id') id: string) {
    return this.problemService.deleteProblem(id);
  }
}
