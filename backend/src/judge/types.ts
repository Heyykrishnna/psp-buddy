export interface JudgeTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface ExecuteRequest {
  sourceCode: string;
  language: string;
  testCases: JudgeTestCase[];
  functionName?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface TestCaseResult {
  testCaseId?: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  error?: string | null;
  runtimeMs?: number;
}

export interface ExecuteResult {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  allPassed: boolean;
  totalPassed: number;
  totalTests: number;
  results: TestCaseResult[];
  compileOutput?: string | null;
  logs?: string | null;
  runtimeMs?: number;
  memoryKb?: number;
}
