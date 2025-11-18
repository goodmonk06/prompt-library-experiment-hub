import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './lib/prisma';
import projectRoutes from './routes/projects';
import promptRoutes from './routes/prompts';
import datasetRoutes from './routes/datasets';
import experimentRoutes from './routes/experiments';

const PORT = parseInt(process.env.PORT || '3001');

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  try {
    // Register CORS
    await server.register(cors, {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    });

    // Health check
    server.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await server.register(projectRoutes, { prefix: '/api/projects' });
    await server.register(promptRoutes, { prefix: '/api/prompts' });
    await server.register(datasetRoutes, { prefix: '/api/datasets' });
    await server.register(experimentRoutes, { prefix: '/api/experiments' });

    // Start server
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
