import { PrismaClient, RoleName, QuestionType, DifficultyLevel, AssessmentType, AttemptStatus } from '@prisma/client';
import { seedLearningPath } from './learning-path.seed';

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

  // 3. Replace only the demo content owned by this seed.
  // Assessment relations cascade to their questions, options, attempts, and map activities;
  // unrelated teacher/student content remains untouched.
  const demoAssessmentIds = [
    'demo-asm-coding',
    'demo-asm-1',
    'demo-asm-2',
    'demo-asm-4',
    'demo-asm-5',
    'demo-asm-6',
    'demo-asm-7',
  ];
  await prisma.assessment.deleteMany({ where: { id: { in: demoAssessmentIds } } });

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
            shortAnswerKeywords: ['seen', 'target', 'return'],
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
            shortAnswerKeywords: ['return', 'reverse'],
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

  // 8. Seed Assessment 5: Recursion & Problem Solving Sprint
  await prisma.assessment.create({
    data: {
      id: 'demo-asm-5',
      title: 'Recursion & Problem Solving Sprint',
      description: 'Practice recursive thinking, base cases, and tracing a solution from the inside out.',
      className: '1st Sem',
      topic: 'Algorithms',
      assessmentType: AssessmentType.QUIZ,
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 20,
      hasNegativeMarking: false,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'recursion-1',
            questionText: 'Which two parts must every correct recursive function include?',
            questionType: QuestionType.MULTIPLE_CHOICE,
            difficulty: DifficultyLevel.EASY,
            points: 10,
            orderIndex: 1,
            options: {
              create: [
                { optionText: 'A base case', isCorrect: true, orderIndex: 1 },
                { optionText: 'A recursive case', isCorrect: true, orderIndex: 2 },
                { optionText: 'A global variable', isCorrect: false, orderIndex: 3 },
                { optionText: 'A sorted array', isCorrect: false, orderIndex: 4 },
              ],
            },
            explanation: 'The base case stops the recursion and the recursive case reduces the problem.',
          },
          {
            id: 'recursion-2',
            questionText: 'True or False: A recursive function without a reachable base case can keep calling itself until the call stack is exhausted.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: DifficultyLevel.EASY,
            points: 5,
            orderIndex: 2,
            trueFalseAnswer: true,
          },
          {
            id: 'recursion-3',
            questionText: 'What is the time complexity of a recursive binary search on a sorted array?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: DifficultyLevel.MEDIUM,
            points: 10,
            orderIndex: 3,
            options: {
              create: [
                { optionText: 'O(1)', isCorrect: false, orderIndex: 1 },
                { optionText: 'O(log n)', isCorrect: true, orderIndex: 2 },
                { optionText: 'O(n)', isCorrect: false, orderIndex: 3 },
                { optionText: 'O(n²)', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
        ],
      },
    },
  });

  // 9. Seed Assessment 6: Data Structures Field Guide
  await prisma.assessment.create({
    data: {
      id: 'demo-asm-6',
      title: 'Data Structures Field Guide',
      description: 'Choose the right structure for queues, stacks, maps, and priority-based work.',
      className: '1st Sem',
      topic: 'Data Structures',
      assessmentType: AssessmentType.QUIZ,
      totalMarks: 30,
      passingMarks: 18,
      durationMinutes: 25,
      hasNegativeMarking: false,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'structures-1',
            questionText: 'Which data structure follows First-In-First-Out order?',
            questionType: QuestionType.SINGLE_CHOICE,
            difficulty: DifficultyLevel.EASY,
            points: 10,
            orderIndex: 1,
            options: {
              create: [
                { optionText: 'Stack', isCorrect: false, orderIndex: 1 },
                { optionText: 'Queue', isCorrect: true, orderIndex: 2 },
                { optionText: 'Tree', isCorrect: false, orderIndex: 3 },
                { optionText: 'Graph', isCorrect: false, orderIndex: 4 },
              ],
            },
          },
          {
            id: 'structures-2',
            questionText: 'Name the structure that stores key-value pairs for fast average lookup.',
            questionType: QuestionType.SHORT_ANSWER,
            difficulty: DifficultyLevel.EASY,
            points: 10,
            orderIndex: 2,
            shortAnswerKeywords: ['hash map', 'hash table', 'dictionary', 'map'],
          },
          {
            id: 'structures-3',
            questionText: 'A priority queue is commonly implemented with a ___.',
            questionType: QuestionType.FILL_IN_BLANKS,
            difficulty: DifficultyLevel.MEDIUM,
            points: 10,
            orderIndex: 3,
            shortAnswerKeywords: ['heap', 'binary heap'],
          },
        ],
      },
    },
  });

  // 10. Seed Assessment 7: Debugging Dojo Assignment
  await prisma.assessment.create({
    data: {
      id: 'demo-asm-7',
      title: 'Debugging Dojo Assignment',
      description: 'Read a small algorithm, find the bug, and explain the fix in a short written submission.',
      className: '1st Sem',
      topic: 'Problem Solving',
      assessmentType: AssessmentType.PRACTICE,
      totalMarks: 20,
      passingMarks: 12,
      durationMinutes: 30,
      hasNegativeMarking: false,
      isPublished: true,
      createdById: teacherUser.id,
      questions: {
        create: [
          {
            id: 'debug-1',
            questionText: 'A loop skips the last item because it uses range(0, len(items) - 1). Explain the boundary fix.',
            questionType: QuestionType.SHORT_ANSWER,
            difficulty: DifficultyLevel.EASY,
            points: 10,
            orderIndex: 1,
            shortAnswerKeywords: ['len(items)', 'range', 'last item', 'off by one'],
            explanation: 'Use range(0, len(items)) or range(len(items)) so the last valid index is included.',
          },
          {
            id: 'debug-2',
            questionText: 'True or False: Logging the input, output, and a useful intermediate value is a practical first debugging step.',
            questionType: QuestionType.TRUE_FALSE,
            difficulty: DifficultyLevel.EASY,
            points: 10,
            orderIndex: 2,
            trueFalseAnswer: true,
          },
        ],
      },
    },
  });

  // Build the synced learning map after all assessment content exists.
  await seedLearningPath(prisma);

  // Seed Standalone Problems
  const dbProblem = (prisma as any).problem;
  if (dbProblem) {
    const p1 = await dbProblem.upsert({
      where: { slug: 'two-sum' },
      update: {},
      create: {
        slug: 'two-sum',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: DifficultyLevel.EASY,
        functionName: 'two_sum',
        starterCodePython: 'def two_sum(nums, target):\n    # Write your solution here\n    pass',
        timeLimitMs: 2000,
        memoryLimitMb: 128,
        points: 10,
      },
    });

    const dbTc = (prisma as any).testCase;
    if (dbTc && p1) {
      await dbTc.deleteMany({ where: { problemId: p1.id } });
      await dbTc.createMany({
        data: [
          { problemId: p1.id, input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false, weight: 1, orderIndex: 1 },
          { problemId: p1.id, input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false, weight: 1, orderIndex: 2 },
          { problemId: p1.id, input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true, weight: 2, orderIndex: 3 },
          { problemId: p1.id, input: '[-1, -2, -3, -4, -5], -8', expectedOutput: '[2, 4]', isHidden: true, weight: 2, orderIndex: 4 },
        ],
      });
    }

    await dbProblem.upsert({
      where: { slug: 'reverse-string' },
      update: {},
      create: {
        slug: 'reverse-string',
        title: 'Reverse String',
        description: 'Write a function that reverses a string. The input string is given as an array of characters.',
        difficulty: DifficultyLevel.EASY,
        functionName: 'reverse_string',
        starterCodePython: 'def reverse_string(s):\n    # Write your solution here\n    return s[::-1]',
        timeLimitMs: 2000,
        memoryLimitMb: 128,
        points: 10,
      },
    });

    await dbProblem.upsert({
      where: { slug: 'valid-palindrome' },
      update: {},
      create: {
        slug: 'valid-palindrome',
        title: 'Valid Palindrome',
        description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
        difficulty: DifficultyLevel.EASY,
        functionName: 'is_palindrome',
        starterCodePython: 'def is_palindrome(s: str) -> bool:\n    # Write your solution here\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]',
        timeLimitMs: 2000,
        memoryLimitMb: 128,
        points: 15,
      },
    });

    await dbProblem.upsert({
      where: { slug: 'fibonacci-number' },
      update: {},
      create: {
        slug: 'fibonacci-number',
        title: 'Fibonacci Number',
        description: 'The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.',
        difficulty: DifficultyLevel.EASY,
        functionName: 'fib',
        starterCodePython: 'def fib(n: int) -> int:\n    # Write your solution here\n    if n <= 1:\n        return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b',
        timeLimitMs: 2000,
        memoryLimitMb: 128,
        points: 10,
      },
    });

    await dbProblem.upsert({
      where: { slug: 'binary-search' },
      update: {},
      create: {
        slug: 'binary-search',
        title: 'Binary Search',
        description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
        difficulty: DifficultyLevel.MEDIUM,
        functionName: 'binary_search',
        starterCodePython: 'def binary_search(nums, target):\n    # Write your solution here\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1',
        timeLimitMs: 2000,
        memoryLimitMb: 128,
        points: 20,
      },
    });
  }

  console.log(' Successfully seeded database with real assessments, problems, and questions!');
}

main()
  .catch((e) => {
    console.error(' Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
