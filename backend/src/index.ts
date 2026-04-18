import app from './app';
import prisma from './config/database';
import { config } from 'dotenv';

config();

const PORT = parseInt(process.env.PORT || '4000', 10);

async function main() {
  try {
    // Test Database Connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
