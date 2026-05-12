import app from './app';
import prisma from './config/database';
import { config } from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket';
import { logger } from './utils/logger';

config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const httpServer = createServer(app);

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
