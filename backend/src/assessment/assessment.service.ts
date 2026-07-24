import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@/database';
import { SubmitAnswerInput } from '@/validation';
import { SyncGateway } from '../gateway/sync.gateway';
import { SyncEventType } from '@/types';

@Injectable()
export class AssessmentService {
  constructor(private syncGateway: SyncGateway) { }

  async getPublishedAssessments() {
    return db.assessment.findMany({
      where: { isPublished: true },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async submitAnswer(studentUserId: string, input: SubmitAnswerInput) {
    const student = await db.student.findUnique({ where: { userId: studentUserId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const question = await db.question.findUnique({
      where: { id: input.questionId },
      include: { options: true },
    });

    if (!question) throw new NotFoundException('Question not found');

    let isCorrect = false;
    let marksObtained = 0;

    if (input.selectedOptionId) {
      const selectedOption = question.options.find((opt: { id: string; isCorrect: boolean }) => opt.id === input.selectedOptionId);
      if (selectedOption?.isCorrect) {
        isCorrect = true;
        marksObtained = question.points;
      }
    }

    const answer = await db.answer.create({
      data: {
        studentId: student.id,
        assessmentId: input.assessmentId,
        questionId: input.questionId,
        selectedOptionId: input.selectedOptionId,
        textAnswer: input.textAnswer,
        isCorrect,
        marksObtained,
      },
    });

    // Reward XP on correct answer
    if (isCorrect) {
      const xpReward = question.points * 10;
      const updatedStudent = await db.student.update({
        where: { id: student.id },
        data: { totalXp: { increment: xpReward } },
      });

      await db.gamificationTransaction.create({
        data: {
          studentId: student.id,
          type: 'XP',
          amount: xpReward,
          reason: 'ASSESSMENT_QUESTION_CORRECT',
          referenceId: answer.id,
        },
      });

      // Broadcast instant XP sync to Web & Mobile clients
      this.syncGateway.broadcastSyncEvent(SyncEventType.XP_UPDATED, studentUserId, {
        newTotalXp: updatedStudent.totalXp,
        earnedXp: xpReward,
      });
    }

    return {
      success: true,
      isCorrect,
      marksObtained,
    };
  }
}
