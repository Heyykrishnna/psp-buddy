import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { ExecutionJob, ExecutionJobResult } from './types';
import { JudgeProvider } from '@/judge/provider';

export const EXECUTION_QUEUE_NAME = 'psp-code-execution';

@Injectable()
export class ExecutionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExecutionQueueService.name);

  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents | null = null;
  private redisConnection: IORedis | null = null;

  readonly isQueueEnabled: boolean;

  constructor(private readonly judgeProvider: JudgeProvider) {
    this.isQueueEnabled = Boolean(
      process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT),
    );
  }

  async onModuleInit() {
    if (!this.isQueueEnabled) {
      this.logger.log('Redis not configured — running in direct (no-queue) mode. Set REDIS_URL to enable BullMQ workers.');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL;
      const connection = redisUrl
        ? new IORedis(redisUrl, { maxRetriesPerRequest: null })
        : new IORedis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT || 6379),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
          });

      this.redisConnection = connection;

      // ── Queue ───────────────────────────────────────────────────────────────
      this.queue = new Queue(EXECUTION_QUEUE_NAME, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });

      // ── Worker ──────────────────────────────────────────────────────────────
      const workerCount = Number(process.env.JUDGE_WORKER_COUNT || 3);
      this.worker = new Worker(
        EXECUTION_QUEUE_NAME,
        async (job: Job<ExecutionJob>) => {
          this.logger.debug(`Worker processing job ${job.id} for problem ${job.data.problemId}`);
          const result = await this.judgeProvider.execute(job.data.request);
          return result;
        },
        {
          connection,
          concurrency: workerCount,
        },
      );

      this.worker.on('completed', (job: Job) => {
        this.logger.debug(`Job ${job.id} completed`);
      });

      this.worker.on('failed', (job: Job | undefined, err: Error) => {
        this.logger.warn(`Job ${job?.id} failed: ${err.message}`);
      });

      // ── Queue Events ────────────────────────────────────────────────────────
      this.queueEvents = new QueueEvents(EXECUTION_QUEUE_NAME, { connection });

      this.logger.log(
        `BullMQ execution queue initialized with ${workerCount} workers. Queue: ${EXECUTION_QUEUE_NAME}`,
      );
    } catch (err: any) {
      this.logger.warn(`Failed to connect to Redis — falling back to direct mode: ${err.message}`);
      this.queue = null;
      this.worker = null;
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.queueEvents?.close();
    this.redisConnection?.disconnect();
  }

  /**
   * Add a code execution job to the BullMQ queue (when Redis is available)
   * or execute directly inline (fallback when Redis is not configured).
   */
  async enqueue(job: ExecutionJob): Promise<ExecutionJobResult> {
    // ── Direct mode (no Redis) ─────────────────────────────────────────────
    if (!this.isQueueEnabled || !this.queue) {
      this.logger.debug(`Direct execution for job ${job.jobId} (no queue)`);
      const result = await this.judgeProvider.execute(job.request);
      return {
        jobId: job.jobId,
        status: 'COMPLETED',
        result,
        startedAt: new Date(),
        completedAt: new Date(),
      };
    }

    // ── Queue mode (Redis + BullMQ) ────────────────────────────────────────
    const bullJob = await this.queue.add(job.jobId, job, {
      jobId: job.jobId,
    });

    this.logger.debug(`Enqueued job ${bullJob.id} for problem ${job.problemId}`);

    // Wait for result (with timeout)
    const result = await bullJob.waitUntilFinished(this.queueEvents!, 30_000);

    return {
      jobId: job.jobId,
      status: 'COMPLETED',
      result,
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }

  async getQueueStats() {
    if (!this.queue) {
      return { mode: 'direct', queueEnabled: false };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return {
      mode: 'bullmq',
      queueEnabled: true,
      queueName: EXECUTION_QUEUE_NAME,
      workers: Number(process.env.JUDGE_WORKER_COUNT || 3),
      stats: { waiting, active, completed, failed },
    };
  }
}
