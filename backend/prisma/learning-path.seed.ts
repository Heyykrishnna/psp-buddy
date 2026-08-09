import { PrismaClient, LearningActivityType } from '@prisma/client';

/**
 * The learning path is a thin, teacher-friendly map over existing assessments.
 * Keep question content in assessments; only progression metadata belongs here.
 */
export const LEARNING_PATH_SEED = [
  {
    key: 'algorithm-academy',
    title: 'Algorithm Academy',
    subtitle: 'Train your logic muscles',
    description: 'Build the foundations of algorithms, complexity, and problem solving.',
    icon: '⚡',
    color: '#7C5CFC',
    orderIndex: 1,
    levels: [
      {
        key: 'complexity-quest',
        title: 'Complexity Quest',
        subtitle: 'Learn to see the hidden cost',
        description: 'Spot Big-O patterns and make smart choices before the timer runs out.',
        icon: '🧭',
        color: '#56C7F2',
        orderIndex: 1,
        xpReward: 120,
        passPercent: 70,
        activities: [
          { assessmentId: 'demo-asm-1', type: LearningActivityType.QUIZ, orderIndex: 1 },
          { assessmentId: 'demo-asm-4', type: LearningActivityType.WORKSHEET, orderIndex: 2 },
        ],
      },
      {
        key: 'systems-station',
        title: 'Systems Station',
        subtitle: 'Keep the machine moving',
        description: 'Explore processes, memory, and the choices that keep systems reliable.',
        icon: '🛰️',
        color: '#FF9F68',
        orderIndex: 2,
        xpReward: 150,
        passPercent: 70,
        activities: [
          { assessmentId: 'demo-asm-2', type: LearningActivityType.QUIZ, orderIndex: 1 },
          { assessmentId: 'demo-asm-coding', type: LearningActivityType.WORKSHEET, orderIndex: 2 },
        ],
      },
    ],
  },
  {
    key: 'builder-bay',
    title: 'Builder Bay',
    subtitle: 'Turn ideas into code',
    description: 'Practice object thinking and ship solutions that hold together.',
    icon: '🛠️',
    color: '#FF6FAE',
    orderIndex: 2,
    levels: [
      {
        key: 'object-town',
        title: 'Object Town',
        subtitle: 'Meet the four pillars',
        description: 'Use abstraction, inheritance, encapsulation, and polymorphism with confidence.',
        icon: '🏘️',
        color: '#FFC857',
        orderIndex: 1,
        xpReward: 160,
        passPercent: 75,
        activities: [
          { assessmentId: 'demo-asm-4', type: LearningActivityType.QUIZ, orderIndex: 1 },
          { assessmentId: 'demo-asm-coding', type: LearningActivityType.WORKSHEET, orderIndex: 2 },
        ],
      },
    ],
  },
] as const;

export async function seedLearningPath(prisma: PrismaClient) {
  for (const chapterSeed of LEARNING_PATH_SEED) {
    const chapter = await prisma.learningChapter.upsert({
      where: { key: chapterSeed.key },
      update: {
        title: chapterSeed.title,
        subtitle: chapterSeed.subtitle,
        description: chapterSeed.description,
        icon: chapterSeed.icon,
        color: chapterSeed.color,
        orderIndex: chapterSeed.orderIndex,
        isPublished: true,
      },
      create: {
        key: chapterSeed.key,
        title: chapterSeed.title,
        subtitle: chapterSeed.subtitle,
        description: chapterSeed.description,
        icon: chapterSeed.icon,
        color: chapterSeed.color,
        orderIndex: chapterSeed.orderIndex,
      },
    });

    for (const levelSeed of chapterSeed.levels) {
      const level = await prisma.learningLevel.upsert({
        where: { key: levelSeed.key },
        update: {
          chapterId: chapter.id,
          title: levelSeed.title,
          subtitle: levelSeed.subtitle,
          description: levelSeed.description,
          icon: levelSeed.icon,
          color: levelSeed.color,
          orderIndex: levelSeed.orderIndex,
          xpReward: levelSeed.xpReward,
          passPercent: levelSeed.passPercent,
          isPublished: true,
        },
        create: {
          key: levelSeed.key,
          chapterId: chapter.id,
          title: levelSeed.title,
          subtitle: levelSeed.subtitle,
          description: levelSeed.description,
          icon: levelSeed.icon,
          color: levelSeed.color,
          orderIndex: levelSeed.orderIndex,
          xpReward: levelSeed.xpReward,
          passPercent: levelSeed.passPercent,
        },
      });

      for (const activity of levelSeed.activities) {
        const assessment = await prisma.assessment.findUnique({
          where: { id: activity.assessmentId },
          select: { id: true },
        });
        if (!assessment) {
          throw new Error(
            `Learning path seed references missing assessment: ${activity.assessmentId}`,
          );
        }

        await prisma.levelActivity.upsert({
          where: {
            levelId_assessmentId: {
              levelId: level.id,
              assessmentId: activity.assessmentId,
            },
          },
          update: { type: activity.type, orderIndex: activity.orderIndex },
          create: {
            levelId: level.id,
            assessmentId: activity.assessmentId,
            type: activity.type,
            orderIndex: activity.orderIndex,
          },
        });
      }
    }
  }

  return prisma.learningChapter.findMany({
    where: { isPublished: true },
    include: { levels: { include: { activities: true } } },
    orderBy: { orderIndex: 'asc' },
  });
}

