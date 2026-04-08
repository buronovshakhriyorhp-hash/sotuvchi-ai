require('dotenv').config();
const buildApp = require('./app');
const prisma = require('./prisma');
const cache = require('./utils/cache');

// Env validation
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(`\n❌ Error: Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Tizim xavfsizligi va ishlashi uchun bular shart. .env faylini tekshiring.\n');
  process.exit(1);
}

const start = async () => {
  const app = buildApp();
  
  // Initialize Redis Cache
  await cache.connect();
  
  // Graceful Shutdown logic
  const closeServer = async (signal) => {
    console.log(`\nReceived ${signal}. Closing server...`);
    try {
      await cache.disconnect();
      await app.close();
      await prisma.$disconnect();
      console.log('✅ Server, Cache and Database disconnected safely.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => closeServer('SIGINT'));
  process.on('SIGTERM', () => closeServer('SIGTERM'));

  try {
    // Initialize Telegram Bot outside of unit/test environment
    if (process.env.NODE_ENV !== 'test') {
      try {
        require('./services/bot.service');
      } catch (botErr) {
        console.error('Telegram Bot init error:', botErr.message);
      }
    }

    const port = parseInt(process.env.PORT) || 5000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 Nexus ERP Backend: http://0.0.0.0:${port}`);
    console.log(`📊 Health check: http://0.0.0.0:${port}/api/health`);
    console.log(`💾 Cache: ${cache.connected ? '✅ ACTIVE' : '⚠️ DISABLED'}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
