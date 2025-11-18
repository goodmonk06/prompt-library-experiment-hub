import { Worker, Job } from 'bullmq';
import prisma from '../lib/prisma';
import { ExperimentJobData } from '../lib/queue';
import { runPrompt } from '../services/openai-service';
import { scoreResult, calculateRunMetrics, ScoreResult } from '../services/scoring-service';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

/**
 * Process a single experiment run
 */
async function processExperimentRun(job: Job<ExperimentJobData>) {
  const { runId, promptVersionId, datasetId, model } = job.data;

  console.log(`Processing experiment run: ${runId}`);

  try {
    // Update run status to running
    await prisma.experimentRun.update({
      where: { id: runId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Get prompt version and dataset items
    const promptVersion = await prisma.promptVersion.findUnique({
      where: { id: promptVersionId },
    });

    if (!promptVersion) {
      throw new Error(`Prompt version ${promptVersionId} not found`);
    }

    const evaluationItems = await prisma.evaluationItem.findMany({
      where: { datasetId },
    });

    console.log(`Running ${evaluationItems.length} evaluation items...`);

    const scores: ScoreResult[] = [];

    // Process each evaluation item
    for (const item of evaluationItems) {
      try {
        const input = JSON.parse(item.inputJson);
        const expectedOutput = item.expectedOutputJson
          ? JSON.parse(item.expectedOutputJson)
          : undefined;

        // Run prompt with OpenAI
        const output = await runPrompt({
          model,
          prompt: promptVersion.templateText,
          input,
        });

        // Score the result
        const score = await scoreResult({
          input,
          output,
          expectedOutput: typeof expectedOutput === 'string' ? expectedOutput : undefined,
          useLLMJudge: false, // Can be enabled based on configuration
        });

        scores.push(score);

        // Save result
        await prisma.experimentResultItem.create({
          data: {
            runId,
            evaluationItemId: item.id,
            outputJson: JSON.stringify({ output }),
            scoreJson: JSON.stringify(score),
          },
        });

        // Update job progress
        await job.updateProgress((scores.length / evaluationItems.length) * 100);
      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        // Continue with next item
      }
    }

    // Calculate aggregated metrics
    const metrics = calculateRunMetrics(scores);

    // Update run as completed
    await prisma.experimentRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        metricsJson: JSON.stringify(metrics),
      },
    });

    console.log(`Completed experiment run: ${runId}`);
    return { runId, metrics };
  } catch (error) {
    console.error(`Error in experiment run ${runId}:`, error);

    // Update run as failed
    await prisma.experimentRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}

// Create worker
const worker = new Worker('experiment-jobs', processExperimentRun, {
  connection,
  concurrency: 1, // Process one experiment at a time
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('🔧 Experiment worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
