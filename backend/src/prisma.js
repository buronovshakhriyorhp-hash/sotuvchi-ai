const { PrismaClient } = require('@prisma/client');

// Optimized Prisma with connection pooling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Disable all console logging in production to speed things up
  errorFormat: 'minimal',
});

// Enable query optimizer hints
prisma.$on('query', ({query, duration}) => {
  if (process.env.NODE_ENV === 'development' && duration > 1000) {
    console.warn(`[SLOW QUERY ${duration}ms] ${query.substring(0, 100)}...`);
  }
});

module.exports = prisma;
