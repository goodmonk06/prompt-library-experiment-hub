import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const projectRoutes: FastifyPluginAsync = async (server) => {
  // List all projects
  server.get('/', async (request, reply) => {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            prompts: true,
            evaluationDatasets: true,
            experiments: true,
          },
        },
      },
    });
    return projects;
  });

  // Get project by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        prompts: {
          include: {
            _count: { select: { versions: true } },
          },
        },
        evaluationDatasets: true,
        experiments: true,
      },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return project;
  });

  // Create project
  server.post('/', async (request, reply) => {
    const body = createProjectSchema.parse(request.body);
    const project = await prisma.project.create({
      data: body,
    });
    return reply.status(201).send(project);
  });

  // Update project
  server.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateProjectSchema.parse(request.body);

    const project = await prisma.project.update({
      where: { id },
      data: body,
    });

    return project;
  });

  // Delete project
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.project.delete({ where: { id } });
    return reply.status(204).send();
  });
};

export default projectRoutes;
