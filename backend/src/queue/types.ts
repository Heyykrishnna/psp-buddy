import { ExecuteRequest, ExecuteResult } from '@/judge/types';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExecutionJob {
  jobId: string;
  problemId: string;
  submissionId?: string;
  userId?: string;
  request: ExecuteRequest;
}

export interface ExecutionJobResult {
  jobId: string;
  status: JobStatus;
  result?: ExecuteResult;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
