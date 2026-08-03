import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '@/database';
import { CreateProblemDto } from './dto/create-problem.dto';
import { DifficultyLevel } from '@/types';

@Injectable()
export class ProblemService {
  async createProblem(dto: CreateProblemDto) {
    const existing = await db.problem.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException(`Problem with slug '${dto.slug}' already exists.`);
    }

    return db.problem.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty || DifficultyLevel.EASY,
        functionName: dto.functionName,
        starterCodePython: dto.starterCodePython,
        timeLimitMs: dto.timeLimitMs || 2000,
        memoryLimitMb: dto.memoryLimitMb || 128,
        points: dto.points || 10,
      },
    });
  }

  async getProblems(query?: { difficulty?: DifficultyLevel; search?: string }) {
    const where: any = {};
    if (query?.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return db.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProblemBySlugOrId(slugOrId: string) {
    let problem = await db.problem.findUnique({ where: { slug: slugOrId } });
    if (!problem) {
      problem = await db.problem.findUnique({ where: { id: slugOrId } });
    }
    if (!problem) {
      throw new NotFoundException(`Problem '${slugOrId}' not found.`);
    }
    return problem;
  }

  async updateProblem(id: string, dto: Partial<CreateProblemDto>) {
    const problem = await db.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');

    return db.problem.update({
      where: { id },
      data: {
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.functionName ? { functionName: dto.functionName } : {}),
        ...(dto.starterCodePython ? { starterCodePython: dto.starterCodePython } : {}),
        ...(dto.timeLimitMs !== undefined ? { timeLimitMs: dto.timeLimitMs } : {}),
        ...(dto.memoryLimitMb !== undefined ? { memoryLimitMb: dto.memoryLimitMb } : {}),
        ...(dto.points !== undefined ? { points: dto.points } : {}),
      },
    });
  }

  async deleteProblem(id: string) {
    const problem = await db.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');

    await db.problem.delete({ where: { id } });
    return { success: true, message: 'Problem deleted successfully.' };
  }
}
