import { Queue, QueueOptions } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const experimentQueue = new Queue('experiment-jobs', { connection });

export interface ExperimentJobData {
  runId: string;
  experimentId: string;
  promptVersionId: string;
  datasetId: string;
  model: string;
}
