import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createPromptSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
});

const updatePromptSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const createVersionSchema = z.object({
  versionTag: z.string().min(1),
  templateText: z.string().min(1),
});

const promptRoutes: FastifyPluginAsync = async (server) => {
  // List prompts for a project
  server.get('/', async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };

    const where = projectId ? { projectId } : {};

    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: { select: { versions: true } },
      },
    });

    return prompts;
  });

  // Get prompt by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        project: true,
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!prompt) {
      return reply.status(404).send({ error: 'Prompt not found' });
    }

    return prompt;
  });

  // Create prompt
  server.post('/', async (request, reply) => {
    const body = createPromptSchema.parse(request.body);
    const prompt = await prisma.prompt.create({
      data: body,
      include: { project: true },
    });
    return reply.status(201).send(prompt);
  });

  // Update prompt
  server.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updatePromptSchema.parse(request.body);

    const prompt = await prisma.prompt.update({
      where: { id },
      data: body,
      include: { project: true, versions: true },
    });

    return prompt;
  });

  // Delete prompt
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.prompt.delete({ where: { id } });
    return reply.status(204).send();
  });

  // Create prompt version
  server.post('/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createVersionSchema.parse(request.body);

    const version = await prisma.promptVersion.create({
      data: {
        promptId: id,
        ...body,
      },
    });

    return reply.status(201).send(version);
  });

  // Get prompt versions
  server.get('/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };

    const versions = await prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { createdAt: 'desc' },
    });

    return versions;
  });

  // Get specific version
  server.get('/:id/versions/:versionId', async (request, reply) => {
    const { versionId } = request.params as { id: string; versionId: string };

    const version = await prisma.promptVersion.findUnique({
      where: { id: versionId },
      include: { prompt: true },
    });

    if (!version) {
      return reply.status(404).send({ error: 'Version not found' });
    }

    return version;
  });
};

export default promptRoutes;
