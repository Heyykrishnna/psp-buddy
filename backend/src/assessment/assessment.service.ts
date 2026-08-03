import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '@/database';
import { SyncGateway } from '../gateway/sync.gateway';
import { AiService } from '../ai/ai.service';
import { SyncEventType } from '@/types';

export interface CreateAssessmentDto {
  title: string;
  description?: string;
  className?: string;
  topic?: string;
  assessmentType?: 'QUIZ' | 'EXAM' | 'PRACTICE';
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  hasNegativeMarking?: boolean;
  negativeMarkValue?: number;
  dueDate?: string;
  isWorkbook?: boolean;
  workbookUrl?: string;
  createdById?: string;
  questions?: Array<{
    questionText: string;
    questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    points?: number;
    negativeMarks?: number;
    orderIndex: number;
    explanation?: string;
    trueFalseAnswer?: boolean;
    shortAnswerKeywords?: string[];
    options?: Array<{
      optionText: string;
      isCorrect: boolean;
      orderIndex: number;
    }>;
  }>;
}

export interface AutosaveAnswerDto {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  booleanAnswer?: boolean;
}

@Injectable()
export class AssessmentService {
  constructor(
    private syncGateway: SyncGateway,
    private aiService: AiService,
  ) { }

  // 1. Create Assessment with Questions & Config
  async createAssessment(dto: CreateAssessmentDto) {
    const assessment = await db.assessment.create({
      data: {
        title: dto.title,
        description: dto.description,
        className: dto.className || '1st Sem',
        topic: dto.topic || 'General',
        assessmentType: dto.assessmentType || 'QUIZ',
        totalMarks: dto.totalMarks || 100,
        passingMarks: dto.passingMarks || 40,
        durationMinutes: dto.durationMinutes || 30,
        hasNegativeMarking: dto.hasNegativeMarking || false,
        negativeMarkValue: dto.negativeMarkValue || 0,
        createdById: dto.createdById || 'teacher-default',
        isPublished: false,
        questions: dto.questions
          ? {
            create: dto.questions.map((q) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              difficulty: q.difficulty || 'MEDIUM',
              topic: q.topic || dto.topic || 'General',
              points: q.points || 1,
              negativeMarks: q.negativeMarks || (dto.hasNegativeMarking ? dto.negativeMarkValue || 0.25 : 0),
              orderIndex: q.orderIndex,
              explanation: q.explanation,
              trueFalseAnswer: q.trueFalseAnswer,
              shortAnswerKeywords: q.shortAnswerKeywords || [],
              options: q.options
                ? {
                  create: q.options.map((opt) => ({
                    optionText: opt.optionText,
                    isCorrect: opt.isCorrect,
                    orderIndex: opt.orderIndex,
                  })),
                }
                : undefined,
            })),
          }
          : undefined,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return assessment;
  }

  // 2. List Assessments (Filter by class / status)
  async getAssessments(query?: { className?: string; isPublished?: boolean }) {
    const where: any = {};
    if (query?.className) where.className = query.className;
    if (query?.isPublished !== undefined) where.isPublished = query.isPublished;

    return db.assessment.findMany({
      where,
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Get Single Assessment with Questions
  async getAssessmentById(id: string) {
    const assessment = await db.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  // 4. Update Assessment Details
  async updateAssessment(id: string, updates: Partial<CreateAssessmentDto>) {
    const existing = await db.assessment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Assessment not found');

    return db.assessment.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        className: updates.className,
        topic: updates.topic,
        assessmentType: updates.assessmentType,
        totalMarks: updates.totalMarks,
        passingMarks: updates.passingMarks,
        durationMinutes: updates.durationMinutes,
        hasNegativeMarking: updates.hasNegativeMarking,
        negativeMarkValue: updates.negativeMarkValue,
      },
    });
  }

  // 5. Publish Assessment & Notify Students
  async publishAssessment(id: string) {
    const assessment = await db.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const published = await db.assessment.update({
      where: { id },
      data: { isPublished: true },
    });

    // Create system notification for students
    await db.notification.create({
      data: {
        userId: 'all-students',
        title: `New Assessment Published: ${published.title}`,
        message: `Your teacher published a new ${published.assessmentType} in ${published.className || 'your class'}. Duration: ${published.durationMinutes} mins.`,
        type: 'ASSESSMENT',
        actionUrl: `/student/assessments/${published.id}`,
      },
    });

    // Broadcast sync event to all web/mobile clients
    this.syncGateway.broadcastSyncEvent(SyncEventType.NOTIFICATION_RECEIVED, 'all-students', {
      assessmentId: published.id,
      title: published.title,
    });

    return published;
  }

  // 6. Start Student Attempt
  async startAttempt(assessmentId: string, studentId: string) {
    const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Find student
    let student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });

    // Create fallback demo student if not found in db
    if (!student) {
      student = await db.student.create({
        data: {
          userId: studentId,
          studentRegistrationNo: `STU-${Date.now().toString().slice(-6)}`,
          gradeLevel: '1st Sem',
        },
      });
    }

    // Check if student has ALREADY submitted an attempt for this assessment
    const submittedAttempt = await db.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentId: student.id,
        status: { in: ['SUBMITTED', 'EVALUATED'] },
      },
    });

    if (submittedAttempt) {
      throw new BadRequestException(
        'You have already completed and submitted this assessment. Re-attempts are not permitted.',
      );
    }

    // Check if active in-progress attempt exists
    const existingAttempt = await db.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentId: student.id,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    const newAttempt = await db.assessmentAttempt.create({
      data: {
        assessmentId,
        studentId: student.id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        maxScore: assessment.totalMarks,
      },
      include: {
        answers: true,
      },
    });

    return newAttempt;
  }

  // 7. Autosave Answer directly to PostgreSQL
  async autosaveAnswer(attemptId: string, dto: AutosaveAnswerDto) {
    const attempt = await db.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Attempt is already submitted or evaluated');
    }

    const question = await db.question.findUnique({ where: { id: dto.questionId } });
    if (!question) throw new NotFoundException('Question not found');

    // Upsert into attempt_answers table in PostgreSQL
    const savedAnswer = await db.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: {
        selectedOptionId: dto.selectedOptionId,
        textAnswer: dto.textAnswer,
        booleanAnswer: dto.booleanAnswer,
        savedAt: new Date(),
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        textAnswer: dto.textAnswer,
        booleanAnswer: dto.booleanAnswer,
      },
    });

    return {
      success: true,
      savedAt: savedAnswer.savedAt,
      answerId: savedAnswer.id,
    };
  }

  // 8. Submit Attempt & Automated Evaluation Engine
  async submitAttempt(attemptId: string) {
    const attempt = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: true,
        student: true,
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    // If attempt was ALREADY evaluated/submitted, return existing result directly (prevents re-submission & double XP)
    if (attempt.status === 'EVALUATED' || attempt.status === 'SUBMITTED') {
      let topicAnalysisReport = [];
      try {
        topicAnalysisReport = attempt.topicAnalysis ? JSON.parse(attempt.topicAnalysis) : [];
      } catch {}
      return {
        success: true,
        attemptId: attempt.id,
        totalScore: attempt.totalScore || 0,
        maxScore: attempt.maxScore || attempt.assessment.totalMarks,
        earnedXp: 0,
        topicAnalysis: topicAnalysisReport,
      };
    }

    const questions = attempt.assessment.questions;
    const studentAnswers = attempt.answers;
    const hasNegative = attempt.assessment.hasNegativeMarking;
    const defaultNegativeVal = attempt.assessment.negativeMarkValue || 0;

    let totalScore = 0;
    let maxScore = 0;
    const topicStats: Record<string, { totalPossible: number; obtained: number; count: number }> = {};

    for (const q of questions) {
      maxScore += q.points;
      const topic = q.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { totalPossible: 0, obtained: 0, count: 0 };
      }
      topicStats[topic].totalPossible += q.points;
      topicStats[topic].count += 1;

      const ans = studentAnswers.find((a: any) => a.questionId === q.id);
      let isCorrect = false;
      let marksObtained = 0;

      if (ans) {
        if (q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') {
          if (ans.selectedOptionId) {
            const correctOpt = q.options.find((o: any) => o.isCorrect);
            if (correctOpt && correctOpt.id === ans.selectedOptionId) {
              isCorrect = true;
              marksObtained = q.points;
            } else if (hasNegative) {
              marksObtained = -Math.abs(q.negativeMarks || defaultNegativeVal);
            }
          }
        } else if (q.questionType === 'TRUE_FALSE') {
          if (ans.booleanAnswer !== undefined && ans.booleanAnswer !== null) {
            if (ans.booleanAnswer === q.trueFalseAnswer) {
              isCorrect = true;
              marksObtained = q.points;
            } else if (hasNegative) {
              marksObtained = -Math.abs(q.negativeMarks || defaultNegativeVal);
            }
          }
        } else if (q.questionType === 'SHORT_ANSWER' || q.questionType === 'FILL_IN_BLANKS') {
          if (ans.textAnswer && ans.textAnswer.trim().length > 0) {
            const userText = ans.textAnswer.trim().toLowerCase();
            const keywords = (q.shortAnswerKeywords || []).map((k: string) => k.toLowerCase());
            const matched = keywords.length > 0
              ? keywords.some((kw: string) => userText.includes(kw))
              : userText.length > 0;

            if (matched) {
              isCorrect = true;
              marksObtained = q.points;
            } else if (hasNegative) {
              marksObtained = -Math.abs(q.negativeMarks || defaultNegativeVal);
            }
          } else if (hasNegative) {
            marksObtained = -Math.abs(q.negativeMarks || defaultNegativeVal);
          }
        } else if (q.questionType === 'CODING') {
          if (ans.textAnswer && ans.textAnswer.trim().length > 0) {
            const userText = ans.textAnswer.trim();
            const lowerText = userText.toLowerCase();
            const keywords = (q.shortAnswerKeywords || []).map((k: string) => k.toLowerCase());

            let passedSolution = false;
            if (keywords.length > 0) {
              passedSolution = keywords.every((kw: string) => lowerText.includes(kw));
            } else {
              const hasCodeStructure =
                lowerText.includes('return') ||
                lowerText.includes('def') ||
                lowerText.includes('function') ||
                lowerText.includes('class');
              const hasNoPlaceholders =
                !lowerText.includes('todo') &&
                !lowerText.includes('fixme') &&
                !lowerText.includes('pass') &&
                !lowerText.includes('return 0');
              passedSolution = hasCodeStructure && hasNoPlaceholders && userText.length > 25;
            }

            if (passedSolution) {
              isCorrect = true;
              marksObtained = q.points;
            } else if (hasNegative) {
              marksObtained = -Math.abs(q.negativeMarks || defaultNegativeVal);
            }
          } else if (hasNegative) {
            marksObtained = -Math.abs(q.negativeMarks || defaultNegativeVal);
          }
        }

        // Update AttemptAnswer with evaluation result
        await db.attemptAnswer.update({
          where: { id: ans.id },
          data: {
            isCorrect,
            marksObtained,
          },
        });
      }

      totalScore += marksObtained;
      topicStats[topic].obtained += Math.max(0, marksObtained);
    }

    // Generate Topic Analysis Report
    const topicAnalysisReport = Object.entries(topicStats).map(([topicName, stats]) => {
      const percentage = stats.totalPossible > 0 ? Math.round((stats.obtained / stats.totalPossible) * 100) : 0;
      let status = 'Needs Improvement';
      if (percentage >= 80) status = 'Mastered';
      else if (percentage >= 50) status = 'Proficient';

      return {
        topic: topicName,
        totalPossible: stats.totalPossible,
        obtained: stats.obtained,
        percentage,
        status,
      };
    });

    const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);

    const evaluatedAttempt = await db.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'EVALUATED',
        submittedAt: new Date(),
        totalScore: finalScore,
        maxScore,
        topicAnalysis: JSON.stringify(topicAnalysisReport),
      },
    });

    // Reward XP to student based on score
    const earnedXp = Math.round(finalScore * 10);
    if (attempt.studentId && earnedXp > 0) {
      await db.student.update({
        where: { id: attempt.studentId },
        data: { totalXp: { increment: earnedXp } },
      });
    }

    // Upsert StudentTopicMastery for each topic — powers deterministic weak-topic detection
    for (const [topicName, stats] of Object.entries(topicStats)) {
      const accuracy = stats.totalPossible > 0 ? (stats.obtained / stats.totalPossible) * 100 : 0;
      const masteryScore = Math.min(100, Math.round(accuracy));

      await db.studentTopicMastery.upsert({
        where: {
          studentId_topic: {
            studentId: attempt.studentId,
            topic: topicName,
          },
        },
        update: {
          assessmentCount: { increment: 1 },
          totalAttempts: { increment: stats.count },
          correctAnswers: { increment: Math.round(stats.obtained / (stats.totalPossible / stats.count || 1)) },
          accuracy: parseFloat(accuracy.toFixed(2)),
          masteryScore: parseFloat(masteryScore.toFixed(2)),
          lastPracticedAt: new Date(),
        },
        create: {
          studentId: attempt.studentId,
          topic: topicName,
          assessmentCount: 1,
          totalAttempts: stats.count,
          correctAnswers: Math.round(stats.obtained),
          accuracy: parseFloat(accuracy.toFixed(2)),
          masteryScore: parseFloat(masteryScore.toFixed(2)),
          lastPracticedAt: new Date(),
        },
      });
    }

    // Broadcast real-time sync event to web & mobile clients
    this.syncGateway.broadcastSyncEvent(SyncEventType.ASSESSMENT_SUBMITTED, attempt.studentId, {
      attemptId: evaluatedAttempt.id,
      assessmentId: attempt.assessmentId,
      score: finalScore,
      maxScore,
    });

    return {
      success: true,
      attemptId: evaluatedAttempt.id,
      totalScore: finalScore,
      maxScore,
      earnedXp,
      topicAnalysis: topicAnalysisReport,
    };
  }

  // 9. Get Attempt Result & Topic Analysis
  async getAttemptResult(attemptId: string) {
    const attempt = await db.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            className: true,
            passingMarks: true,
            totalMarks: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt result not found');

    const topicAnalysis = attempt.topicAnalysis ? JSON.parse(attempt.topicAnalysis) : [];

    return {
      attemptId: attempt.id,
      assessmentTitle: attempt.assessment.title,
      className: attempt.assessment.className,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      totalScore: attempt.totalScore || 0,
      maxScore: attempt.maxScore || attempt.assessment.totalMarks,
      passingMarks: attempt.assessment.passingMarks,
      isPassed: (attempt.totalScore || 0) >= attempt.assessment.passingMarks,
      topicAnalysis,
      answers: attempt.answers.map((a: any) => ({
        questionId: a.questionId,
        questionText: a.question.questionText,
        questionType: a.question.questionType,
        topic: a.question.topic,
        points: a.question.points,
        selectedOptionId: a.selectedOptionId,
        textAnswer: a.textAnswer,
        booleanAnswer: a.booleanAnswer,
        isCorrect: a.isCorrect,
        marksObtained: a.marksObtained,
        explanation: a.question.explanation,
      })),
    };
  }

  // 10. Student Solved Workbook Submission with AI Auto-Grading & Sync
  async submitWorkbook(assessmentId: string, studentId: string, fileUrl: string, fileName?: string) {
    const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    let student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      student = await db.student.findFirst({ where: { userId: studentId } });
    }
    if (!student) {
      student = await db.student.findFirst();
    }
    if (!student) throw new NotFoundException('Student record not found');

    // Perform AI Auto-Evaluation of the workbook submission
    const aiResult = await this.aiService.evaluateWorkbookImage(
      fileUrl,
      assessment.title,
      assessment.totalMarks,
    );

    const upload = await db.workbookUpload.create({
      data: {
        assessmentId: assessment.id,
        studentId: student.id,
        fileName: fileName || `workbook_${Date.now()}.png`,
        fileUrl,
        obtainedMarks: aiResult.obtainedMarks,
        maxMarks: aiResult.maxMarks,
        aiFeedback: aiResult.aiFeedback,
        status: 'EVALUATED',
        evaluatedAt: new Date(),
      },
      include: {
        assessment: {
          select: { title: true, totalMarks: true, dueDate: true },
        },
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    // Update Student total XP (+ obtainedMarks * 10)
    const xpBonus = Math.round(aiResult.obtainedMarks * 10);
    await db.student.update({
      where: { id: student.id },
      data: { totalXp: { increment: xpBonus } },
    });

    // Broadcast real-time SyncGateway event for Teacher & Student portals
    this.syncGateway.broadcastSyncEvent(SyncEventType.WORKBOOK_SUBMITTED, student.id, {
      workbookId: upload.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      obtainedMarks: upload.obtainedMarks,
      maxMarks: upload.maxMarks,
      aiFeedback: upload.aiFeedback,
      status: upload.status,
    });

    return upload;
  }

  // 11. Get All Solved Workbooks for an Assessment (Teacher View)
  async getAssessmentWorkbooks(assessmentId: string) {
    return db.workbookUpload.findMany({
      where: { assessmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, avatarUrl: true, studentRegistrationNo: true },
            },
          },
        },
        assessment: {
          select: { title: true, className: true, totalMarks: true, dueDate: true },
        },
      },
    });
  }

  // 12. Get Student's Solved Workbooks (Student View)
  async getStudentWorkbooks(studentId: string) {
    let student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      student = await db.student.findFirst({ where: { userId: studentId } });
    }

    return db.workbookUpload.findMany({
      where: student ? { studentId: student.id } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        assessment: {
          select: { id: true, title: true, className: true, totalMarks: true, dueDate: true },
        },
      },
    });
  }

  // 13. Teacher Override/Manual Grading of Workbook
  async evaluateWorkbook(workbookId: string, obtainedMarks: number, feedback?: string) {
    const upload = await db.workbookUpload.findUnique({ where: { id: workbookId } });
    if (!upload) throw new NotFoundException('Workbook upload not found');

    const updated = await db.workbookUpload.update({
      where: { id: workbookId },
      data: {
        obtainedMarks,
        aiFeedback: feedback || upload.aiFeedback,
        status: 'EVALUATED',
        evaluatedAt: new Date(),
      },
      include: {
        assessment: true,
        student: { include: { user: true } },
      },
    });

    this.syncGateway.broadcastSyncEvent(SyncEventType.WORKBOOK_EVALUATED, updated.studentId, {
      workbookId: updated.id,
      obtainedMarks: updated.obtainedMarks,
      maxMarks: updated.maxMarks,
      feedback: updated.aiFeedback,
    });

    return updated;
  }

  // 14. Get Teacher Assessment Results Summary (Teacher Portal)
  async getAssessmentResults(assessmentId: string) {
    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          include: { options: true },
          orderBy: { orderIndex: 'asc' },
        },
        attempts: {
          where: { status: { in: ['SUBMITTED', 'EVALUATED'] } },
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            answers: {
              include: {
                question: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!assessment) throw new NotFoundException('Assessment not found');

    const totalAttempts = assessment.attempts.length;
    let totalScoreSum = 0;
    let passCount = 0;
    let failCount = 0;
    let highestScore = 0;
    let lowestScore = totalAttempts > 0 ? assessment.attempts[0].totalScore || 0 : 0;

    const studentResults = assessment.attempts.map((att: any) => {
      const score = att.totalScore || 0;
      const maxScore = att.maxScore || assessment.totalMarks;
      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      const passed = score >= assessment.passingMarks;

      totalScoreSum += score;
      if (passed) passCount++;
      else failCount++;

      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;

      const studentName = att.student?.user
        ? `${att.student.user.firstName} ${att.student.user.lastName}`.trim()
        : att.student?.studentRegistrationNo || 'Student';

      const email = att.student?.user?.email || 'student@psplumora.edu';

      const answers = (att.answers || []).map((ans: any) => ({
        questionText: ans.question?.questionText || 'Question',
        topic: ans.question?.topic || 'General',
        isCorrect: !!ans.isCorrect,
        marksObtained: ans.marksObtained || 0,
        maxMarks: ans.question?.points || 10,
      }));

      return {
        studentId: att.studentId,
        attemptId: att.id,
        studentName,
        email,
        score,
        maxScore,
        percentage,
        timeTakenMinutes: Math.max(
          1,
          Math.round(((att.submittedAt?.getTime() || 0) - (att.startedAt?.getTime() || 0)) / 60000),
        ),
        submittedAt: att.submittedAt ? att.submittedAt.toISOString() : new Date().toISOString(),
        passed,
        answers,
      };
    });

    const avgScore = totalAttempts > 0 ? Math.round((totalScoreSum / totalAttempts) * 10) / 10 : 0;

    const questionAnalysis = assessment.questions.map((q: any) => {
      const allAnswersForQ = assessment.attempts.flatMap((att: any) =>
        (att.answers || []).filter((ans: any) => ans.questionId === q.id),
      );
      const totalAnswered = allAnswersForQ.length;
      const correctCount = allAnswersForQ.filter((ans: any) => ans.isCorrect).length;
      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

      return {
        questionText: q.questionText,
        topic: q.topic || 'General',
        totalAnswered,
        correctCount,
        accuracy,
      };
    });

    return {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      className: assessment.className,
      topic: assessment.topic,
      assessmentType: assessment.assessmentType,
      totalMarks: assessment.totalMarks,
      passingMarks: assessment.passingMarks,
      durationMinutes: assessment.durationMinutes,
      totalAttempts,
      avgScore,
      passCount,
      failCount,
      highestScore,
      lowestScore,
      questionAnalysis,
      studentResults,
    };
  }

  // 15. Get All Attempts for a Student
  async getStudentAttempts(studentId: string) {
    let student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });

    if (!student) {
      return [];
    }

    return db.assessmentAttempt.findMany({
      where: { studentId: student.id },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            className: true,
            assessmentType: true,
            totalMarks: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}
