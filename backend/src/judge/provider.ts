import { ExecuteRequest, ExecuteResult } from './types';

export abstract class JudgeProvider {
  abstract execute(request: ExecuteRequest): Promise<ExecuteResult>;
}
