import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createDatasetSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  specJson: z.string().optional(),
});

const updateDatasetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  specJson: z.string().optional(),
});

const uploadItemsSchema = z.object({
  items: z.array(
    z.object({
      inputJson: z.string(),
      expectedOutputJson: z.string().optional(),
      tagsJson: z.string().optional(),
    })
  ),
});

const datasetRoutes: FastifyPluginAsync = async (server) => {
  // List datasets
  server.get('/', async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };

    const where = projectId ? { projectId } : {};

    const datasets = await prisma.evaluationDataset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        _count: { select: { items: true } },
      },
    });

    return datasets;
  });

  // Get dataset by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const dataset = await prisma.evaluationDataset.findUnique({
      where: { id },
      include: {
        project: true,
        items: {
          take: 100, // Limit items in single response
        },
        _count: { select: { items: true } },
      },
    });

    if (!dataset) {
      return reply.status(404).send({ error: 'Dataset not found' });
    }

    return dataset;
  });

  // Create dataset
  server.post('/', async (request, reply) => {
    const body = createDatasetSchema.parse(request.body);
    const dataset = await prisma.evaluationDataset.create({
      data: body,
      include: { project: true },
    });
    return reply.status(201).send(dataset);
  });

  // Update dataset
  server.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateDatasetSchema.parse(request.body);

    const dataset = await prisma.evaluationDataset.update({
      where: { id },
      data: body,
      include: { project: true },
    });

    return dataset;
  });

  // Delete dataset
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.evaluationDataset.delete({ where: { id } });
    return reply.status(204).send();
  });

  // Upload evaluation items (JSONL style)
  server.post('/:id/items', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = uploadItemsSchema.parse(request.body);

    const items = await prisma.evaluationItem.createMany({
      data: body.items.map((item) => ({
        datasetId: id,
        ...item,
      })),
    });

    // Update item count
    const count = await prisma.evaluationItem.count({
      where: { datasetId: id },
    });

    await prisma.evaluationDataset.update({
      where: { id },
      data: { itemCount: count },
    });

    return reply.status(201).send({ created: items.count, totalCount: count });
  });

  // Get dataset items
  server.get('/:id/items', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { limit = '100', offset = '0' } = request.query as { limit?: string; offset?: string };

    const items = await prisma.evaluationItem.findMany({
      where: { datasetId: id },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { id: 'asc' },
    });

    return items;
  });
};

export default datasetRoutes;
