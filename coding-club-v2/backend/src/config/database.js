const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  pool: {
    open: (connection) => {
      console.log('[Prisma] Connection opened');
    },
    close: (connection) => {
      console.log('[Prisma] Connection closed');
    },
  },
});

module.exports = prisma;
