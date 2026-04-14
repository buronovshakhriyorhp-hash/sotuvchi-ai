const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const compress = require('@fastify/compress');
const multipart = require('@fastify/multipart');
const staticFiles = require('@fastify/static');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const path = require('path');
const client = require('prom-client');
require('dotenv').config();

const cache = require('./utils/cache');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const saleRoutes = require('./routes/sales');
const warehouseRoutes = require('./routes/warehouse-unified');
const debtRoutes = require('./routes/debts');
const staffRoutes = require('./routes/staff');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const attributeRoutes = require('./routes/attributes');
const searchRoutes = require('./routes/search');
const telegramRoutes = require('./routes/telegram');
const expenseRoutes = require('./routes/expenses');
const auditRoutes = require('./routes/audit');
const permissionRoutes = require('./routes/permissions');
const productionRoutes = require('./routes/production');
const saasRoutes = require('./routes/saas');
const businessRoutes = require('./routes/business');
const prisma = require('./prisma');

function buildApp() {
  const app = Fastify({
    logger: (process.env.NODE_ENV || 'production') !== 'production' ? {
      transport: { target: 'pino-pretty', options: { colorize: true } }
    } : {
      transport: {
        targets: [
          {
            target: 'pino-roll',
            options: {
              file: path.join(__dirname, '../logs/app.log'),
              frequency: 'daily',
              size: '10m',
              mkdir: true
            }
          },
          {
            target: 'pino/file',
            options: { destination: 1 } // stdout
          }
        ]
      }
    }
  });

  // Initialize cache
  app.decorate('cache', cache);

  // Security headers
  app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  // Rate limiting (Relaxed for high-performance POS)
  const rateMax = process.env.NODE_ENV === 'production' ? 2000 : 1000;
  app.register(rateLimit, {
    max: rateMax,
    timeWindow: '1 minute'
  });

  // Plugins
  app.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL].filter(Boolean) 
      : true, // Allow all in dev, restricted in prod
    credentials: true,
  });

  app.register(compress, { 
    global: true,
    threshold: 1024 // Only compress responses > 1KB
  });

  // Multipart for file uploads (limit 10MB)
  app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 }
  });

  // Serve uploaded files statically
  app.register(staticFiles, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
    decorateReply: false,
    constraints: {}
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET,
    sign: { expiresIn: '8h' },
  });

  // Auth decorator
  app.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
      
      // SUPERADMIN Bypass: If user is SUPERADMIN, skip business status/trial checks
      if (request.user.role === 'SUPERADMIN') return;

      const { businessId } = request.user;
      if (!businessId) return;

      // SaaS Hardening: Check if business is active and trial is valid (Cached for 1 minute)
      const cacheKey = `business:active:${businessId}`;
      let bizStatus = await cache.get(cacheKey);

      if (bizStatus === null) {
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { isActive: true, trialExpiresAt: true, plan: true }
        });
        
        if (!business) {
          return reply.status(404).send({ success: false, error: 'Biznes topilmadi' });
        }

        const isTrialValid = !business.trialExpiresAt || business.trialExpiresAt > new Date();
        const active = !!business.isActive && (business.plan === 'PREMIUM' || isTrialValid);
        
        bizStatus = { active, business };
        await cache.set(cacheKey, bizStatus, 60); // Cache for 1 min
      }
      
      if (!bizStatus.active) {
        return reply.status(403).send({ 
          success: false, 
          error: 'Hisobingiz faol emas yoki sinov muddati tugagan. Iltimos, administrator bilan bog\'laning.',
          trialExpired: true 
        });
      }

      // Add user to request for route access
      // (JWT Verify already adds it, but we ensure it's here)
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token muddati o\'tgan' : 'Token yaroqsiz';
      reply.status(401).send({ success: false, error: msg });
    }
  });

  if (process.env.FORCE_HTTPS === 'true') {
    app.addHook('onRequest', async (request, reply) => {
      const proto = request.headers['x-forwarded-proto'] || request.protocol;
      if (proto && proto.toLowerCase() === 'http') {
        const host = request.headers.host;
        const url = `https://${host}${request.raw.url}`;
        reply.redirect(301, url);
      }
    });
  }

  // Prometheus metrics — SEC-07: faqat authenticated foydalanuvchilar (ADMIN/SUPERADMIN)
  client.collectDefaultMetrics({ timeout: 5000 });
  app.get('/metrics', { preHandler: [app.authenticate] }, async (request, reply) => {
    // Faqat ADMIN yoki SUPERADMIN ko'rishi mumkin
    if (!['ADMIN', 'SUPERADMIN'].includes(request.user.role)) {
      return reply.status(403).send({ success: false, error: 'Ruxsat yo\'q' });
    }
    reply.header('Content-Type', client.register.contentType);
    return await client.register.metrics();
  });

  // Health check (Checks connectivity to DB and Cache)
  app.get('/api/health', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'ok', 
        time: new Date().toISOString(), 
        database: 'connected', 
        cache: cache.connected 
      };
    } catch (err) {
      app.log.error('Health Check Failed:', err);
      reply.status(503).send({ 
        status: 'error', 
        database: 'disconnected', 
        cache: cache.connected 
      });
    }
  });

  // Routes
  // Rate-limit login routeida bevosita belgilangan (auth.js ichida config.rateLimit)
  app.register(authRoutes,       { prefix: '/api/auth' });
  app.register(productRoutes,    { prefix: '/api/products' });
  app.register(categoryRoutes,   { prefix: '/api/categories' });
  app.register(customerRoutes,   { prefix: '/api/customers' });
  app.register(supplierRoutes,   { prefix: '/api/suppliers' });
  app.register(saleRoutes,       { prefix: '/api/sales' });
  app.register(warehouseRoutes,  { prefix: '/api/warehouses' }); // Unified
  app.register(debtRoutes,       { prefix: '/api/debts' });
  app.register(staffRoutes,      { prefix: '/api/staff' });
  app.register(orderRoutes,      { prefix: '/api/orders' });
  app.register(reportRoutes,     { prefix: '/api/reports' });
  app.register(attributeRoutes,  { prefix: '/api/attributes' });
  app.register(searchRoutes,     { prefix: '/api/search' });
  app.register(telegramRoutes,   { prefix: '/api/telegram' });
  app.register(expenseRoutes,    { prefix: '/api/expenses' });
  app.register(auditRoutes,      { prefix: '/api/audit' });
  app.register(permissionRoutes, { prefix: '/api/permissions' });
  app.register(saasRoutes,       { prefix: '/api/saas' });
  app.register(productionRoutes, { prefix: '/api/production' });
  app.register(businessRoutes,   { prefix: '/api/business' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || (error.validation ? 400 : 500);
    const isClientError = statusCode >= 400 && statusCode < 500;

    app.log.error({
      err: error,
      requestId: request.id,
      method: request.method,
      url: request.url,
      body: request.body,
      user: request.user ? { id: request.user.id, businessId: request.user.businessId } : 'guest'
    });

    reply.status(statusCode).send({
      success: false,
      error: isClientError ? error.message : 'Serverda ichki xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.',
      // SEC-11: Default = production (stack trace HECH QACHON chiqmasligi kerak)
      ...((process.env.NODE_ENV || 'production') !== 'production' && { details: error.details, stack: error.stack })
    });
  });

  return app;
}

module.exports = buildApp;
