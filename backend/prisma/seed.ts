import { PrismaClient, RoleName, QuestionType, DifficultyLevel, AssessmentType, AttemptStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Create Default Teacher User
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@lumora.edu' },
    update: {},
    create: {
      email: 'teacher@lumora.edu',
      firstName: 'Dr. Evelyn',
      lastName: 'Vance',
      role: RoleName.TEACHER,
      isEmailVerified: true,
      teacher: {
        create: {
          employeeId: 'EMP-1001',
          department: 'Computer Science & Engineering',
        },
      },
    },
    include: { teacher: true },
  });

  // 2. Create Default Student User
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@lumora.edu' },
    update: {},
    create: {
      email: 'student@lumora.edu',
      firstName: 'Alex',
      lastName: 'Rivera',
      role: RoleName.STUDENT,
      isEmailVerified: true,
      student: {
        create: {
          studentRegistrationNo: 'REG-2026-001',
          gradeLevel: '1st Sem',
          totalXp: 450,
          coins: 120,
          currentStreak: 5,
        },
      },
    },
    include: { student: true },
  });

  // 3. Clear existing assessments for clean re-seeding
  await prisma.attemptAnswer.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.assessment.deleteMany({});

  // 4. Seed Assessment 1: Python & Algorithms Coding Playground
  const codingAsm = await prisma.assessment.create({
    data: {
      id: 'demo-asm-coding',
      title: 'Python & Algorithms Coding Playground Assessment',
      description: 'Interactive Coding Playground assessment covering Two Sum, Array Reversal, and Algorithm optimization. Solve in the web IDE and pass test cases.',
      className: '1st Sem',
      topic: 'Data Structures & Algorithms',
      assessmentType: AssessmentType.PRACTICE,
      totalMarks: 50,
      passingMarks: 30,
      durationMinutes: 45,
      hasNegativeMarking: false,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'cq-1',
            questionText: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
            questionType: QuestionType.CODING,
            difficulty: DifficultyLevel.MEDIUM,
            points: 25,
            orderIndex: 1,
            topic: 'Arrays & Hashing',
            explanation: 'Use a hash map to store complement values for O(n) time complexity.',
          },
          {
            id: 'cq-2',
            questionText: 'Write a function `reverse_string(s)` that reverses a string in-place or returns the reversed string.',
            questionType: QuestionType.CODING,
            difficulty: DifficultyLevel.EASY,
            points: 25,
            orderIndex: 2,
            topic: 'Strings',
            explanation: 'Use two pointers or string slicing s[::-1].',
          },
        ],
      },
    },
  });

  // 5. Seed Assessment 2: Algorithm Complexity & Data Structures Quiz
  const algoAsm = await prisma.assessment.create({
    data: {
      id: 'demo-asm-1',
      title: 'Algorithm Complexity & Data Structures Quiz',
      description: 'Evaluates Big-O notation, stacks, queues, hash tables, and sorting algorithms.',
      className: '1st Sem',
      topic: 'Computer Science',
      assessmentType: AssessmentType.QUIZ,
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 30,
      hasNegativeMarking: true,
      negativeMarkValue: 0.5,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'q-1',
            questionText: 'What is the average time complexity of QuickSort?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: DifficultyLevel.MEDIUM,
            points: 5,
            orderIndex: 1,
            explanation: 'QuickSort has an average-case time complexity of O(n log n).',
            options: {
              create: [
                { optionText: 'O(n²)', isCorrect: false, orderIndex: 1 },
                { optionText: 'O(n log n)', isCorrect: true, orderIndex: 2 },
                { optionText: 'O(n)', isCorrect: false, orderIndex: 3 },
                { optionText: 'O(log n)', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            id: 'q-2',
            questionText: 'In a Hash Table with open addressing, collisions resolve to ___ slots.',
            questionType: QuestionType.FILL_IN_BLANKS,
            difficulty: DifficultyLevel.EASY,
            points: 5,
            orderIndex: 2,
            shortAnswerKeywords: ['adjacent', 'linear', 'consecutive'],
            explanation: 'Linear probing resolves collisions by checking consecutive adjacent slots.',
          },
          {
            id: 'q-3',
            questionText: 'True or False: BFS algorithm uses a Queue data structure.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: DifficultyLevel.EASY,
            points: 5,
            orderIndex: 3,
            trueFalseAnswer: true,
            explanation: 'BFS explores neighbors level-by-level using a FIFO queue.',
          },
          {
            id: 'q-4',
            questionText: 'Explain the main difference between Stack and Queue data structures.',
            questionType: QuestionType.SHORT_ANSWER,
            difficulty: DifficultyLevel.MEDIUM,
            points: 10,
            orderIndex: 4,
            shortAnswerKeywords: ['LIFO', 'FIFO', 'stack', 'queue'],
            explanation: 'Stack uses Last-In-First-Out (LIFO), whereas Queue uses First-In-First-Out (FIFO).',
          },
        ],
      },
    },
  });

  // 6. Seed Assessment 3: System Architecture & Operating Systems Exam
  const osAsm = await prisma.assessment.create({
    data: {
      id: 'demo-asm-2',
      title: 'System Architecture & Operating Systems Exam',
      description: 'Deep dive into process scheduling, memory allocation, page faults, and threads.',
      className: '1st Sem',
      topic: 'Computer Science',
      assessmentType: AssessmentType.EXAM,
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 30,
      hasNegativeMarking: false,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'os-1',
            questionText: 'Which process scheduling algorithm can cause starvation for long processes?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: DifficultyLevel.MEDIUM,
            points: 10,
            orderIndex: 1,
            options: {
              create: [
                { optionText: 'Round Robin', isCorrect: false, orderIndex: 1 },
                { optionText: 'Shortest Job First (SJF)', isCorrect: true, orderIndex: 2 },
                { optionText: 'FIFO', isCorrect: false, orderIndex: 3 },
              ],
            },
          },
          {
            id: 'os-2',
            questionText: 'Virtual memory allocation relies on fixed-size blocks called ___.',
            questionType: QuestionType.FILL_IN_BLANKS,
            difficulty: DifficultyLevel.EASY,
            points: 15,
            orderIndex: 2,
            shortAnswerKeywords: ['pages', 'page'],
          },
        ],
      },
    },
  });

  // 7. Seed Assessment 4: Object Oriented Programming Concepts
  const oopAsm = await prisma.assessment.create({
    data: {
      id: 'demo-asm-4',
      title: 'Object Oriented Programming Concepts',
      description: 'Tests understanding of inheritance, polymorphism, encapsulation, and abstraction.',
      className: '1st Sem',
      topic: 'Programming',
      assessmentType: AssessmentType.QUIZ,
      totalMarks: 20,
      passingMarks: 12,
      durationMinutes: 25,
      hasNegativeMarking: true,
      negativeMarkValue: 0.25,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'oop-1',
            questionText: 'Which OOP principle allows a subclass to provide a specific implementation of a method declared in its parent class?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: DifficultyLevel.EASY,
            points: 5,
            orderIndex: 1,
            options: {
              create: [
                { optionText: 'Encapsulation', isCorrect: false, orderIndex: 1 },
                { optionText: 'Polymorphism', isCorrect: true, orderIndex: 2 },
                { optionText: 'Abstraction', isCorrect: false, orderIndex: 3 },
                { optionText: 'Inheritance', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            id: 'oop-2',
            questionText: 'Hiding implementation details and showing only essential features is called ___.',
            questionType: QuestionType.FILL_IN_BLANKS,
            difficulty: DifficultyLevel.MEDIUM,
            points: 15,
            orderIndex: 2,
            shortAnswerKeywords: ['abstraction'],
          },
        ],
      },
    },
  });

  console.log(' Successfully seeded database with real assessments and questions!');
}

main()
  .catch((e) => {
    console.error(' Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
