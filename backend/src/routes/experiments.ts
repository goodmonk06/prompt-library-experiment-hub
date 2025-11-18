import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { experimentQueue, ExperimentJobData } from '../lib/queue';

const createExperimentSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  model: z.string().min(1),
});

const updateExperimentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  model: z.string().optional(),
});

const createRunSchema = z.object({
  promptVersionId: z.string(),
  datasetId: z.string(),
});

const experimentRoutes: FastifyPluginAsync = async (server) => {
  // List experiments
  server.get('/', async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };

    const where = projectId ? { projectId } : {};

    const experiments = await prisma.experiment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        _count: { select: { runs: true } },
      },
    });

    return experiments;
  });

  // Get experiment by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const experiment = await prisma.experiment.findUnique({
      where: { id },
      include: {
        project: true,
        runs: {
          orderBy: { createdAt: 'desc' },
          include: {
            promptVersion: {
              include: { prompt: true },
            },
            dataset: true,
            _count: { select: { resultItems: true } },
          },
        },
      },
    });

    if (!experiment) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    return experiment;
  });

  // Create experiment
  server.post('/', async (request, reply) => {
    const body = createExperimentSchema.parse(request.body);
    const experiment = await prisma.experiment.create({
      data: body,
      include: { project: true },
    });
    return reply.status(201).send(experiment);
  });

  // Update experiment
  server.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateExperimentSchema.parse(request.body);

    const experiment = await prisma.experiment.update({
      where: { id },
      data: body,
      include: { project: true },
    });

    return experiment;
  });

  // Delete experiment
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.experiment.delete({ where: { id } });
    return reply.status(204).send();
  });

  // Create experiment run
  server.post('/:id/runs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createRunSchema.parse(request.body);

    // Get experiment details
    const experiment = await prisma.experiment.findUnique({
      where: { id },
    });

    if (!experiment) {
      return reply.status(404).send({ error: 'Experiment not found' });
    }

    // Create run
    const run = await prisma.experimentRun.create({
      data: {
        experimentId: id,
        promptVersionId: body.promptVersionId,
        datasetId: body.datasetId,
        status: 'pending',
      },
      include: {
        promptVersion: true,
        dataset: true,
      },
    });

    // Enqueue job
    const jobData: ExperimentJobData = {
      runId: run.id,
      experimentId: id,
      promptVersionId: body.promptVersionId,
      datasetId: body.datasetId,
      model: experiment.model,
    };

    await experimentQueue.add('run-experiment', jobData);

    return reply.status(201).send(run);
  });

  // Get experiment runs
  server.get('/:id/runs', async (request, reply) => {
    const { id } = request.params as { id: string };

    const runs = await prisma.experimentRun.findMany({
      where: { experimentId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        promptVersion: {
          include: { prompt: true },
        },
        dataset: true,
        _count: { select: { resultItems: true } },
      },
    });

    return runs;
  });

  // Get specific run
  server.get('/:id/runs/:runId', async (request, reply) => {
    const { runId } = request.params as { id: string; runId: string };

    const run = await prisma.experimentRun.findUnique({
      where: { id: runId },
      include: {
        experiment: true,
        promptVersion: {
          include: { prompt: true },
        },
        dataset: true,
        resultItems: {
          include: {
            evaluationItem: true,
          },
          take: 100, // Limit result items
        },
        _count: { select: { resultItems: true } },
      },
    });

    if (!run) {
      return reply.status(404).send({ error: 'Run not found' });
    }

    return run;
  });

  // Get run results
  server.get('/:id/runs/:runId/results', async (request, reply) => {
    const { runId } = request.params as { id: string; runId: string };
    const { limit = '100', offset = '0' } = request.query as { limit?: string; offset?: string };

    const results = await prisma.experimentResultItem.findMany({
      where: { runId },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        evaluationItem: true,
      },
      orderBy: { id: 'asc' },
    });

    return results;
  });
};

export default experimentRoutes;
