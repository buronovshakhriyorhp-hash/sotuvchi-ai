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
const warehouseRoutes = require('./routes/warehouse');
const debtRoutes = require('./routes/debts');
const staffRoutes = require('./routes/staff');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const warehousesRoutes = require('./routes/warehouses');
const attributeRoutes = require('./routes/attributes');
const searchRoutes = require('./routes/search');
const telegramRoutes = require('./routes/telegram');
const expenseRoutes = require('./routes/expenses');
const auditRoutes = require('./routes/audit');
const permissionRoutes = require('./routes/permissions');

function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'production' ? {
      transport: { target: 'pino-pretty', options: { colorize: true } }
    } : false
  });

  // Initialize cache
  app.decorate('cache', cache);

  // Security headers
  app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  // Rate limiting (adaptive based on environment)
  const rateMax = process.env.NODE_ENV === 'production' ? 1000 : 500;
  app.register(rateLimit, {
    max: rateMax,
    timeWindow: '1 minute'
  });

  // Plugins
  app.register(cors, {
    origin: true,
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

  // Auth decorator — routes'da await request.jwtVerify() ishlatish uchun
  app.decorate('authenticate', async function(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.status(401).send({ success: false, error: 'Token yaroqsiz yoki muddati o\'tgan' });
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

  // Prometheus metrics endpoint for monitoring
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ timeout: 5000 });
  app.get('/metrics', async () => {
    return await client.register.metrics();
  });

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString(), cache: cache.connected }));

  // Routes
  app.register(authRoutes,      { prefix: '/api/auth' });
  app.register(productRoutes,   { prefix: '/api/products' });
  app.register(categoryRoutes,  { prefix: '/api/categories' });
  app.register(customerRoutes,  { prefix: '/api/customers' });
  app.register(supplierRoutes,  { prefix: '/api/suppliers' });
  app.register(saleRoutes,      { prefix: '/api/sales' });
  app.register(warehouseRoutes, { prefix: '/api/warehouse' });
  app.register(debtRoutes,      { prefix: '/api/debts' });
  app.register(staffRoutes,     { prefix: '/api/staff' });
  app.register(orderRoutes,     { prefix: '/api/orders' });
  app.register(reportRoutes,    { prefix: '/api/reports' });
  app.register(warehousesRoutes, { prefix: '/api/warehouses' });
  app.register(attributeRoutes,  { prefix: '/api/attributes' });
  app.register(searchRoutes,     { prefix: '/api/search' });
  app.register(telegramRoutes,   { prefix: '/api/telegram' });
  app.register(expenseRoutes,    { prefix: '/api/expenses' });
  app.register(auditRoutes,      { prefix: '/api/audit' });
  app.register(permissionRoutes, { prefix: '/api/permissions' });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const isClientError = statusCode >= 400 && statusCode < 500;

    app.log.error({
      err: error,
      request: { method: request.method, url: request.url, body: request.body }
    });

    reply.status(statusCode).send({
      success: false,
      error: isClientError ? error.message : 'Serverda ichki xatolik yuz berdi',
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  });

  return app;
}

module.exports = buildApp;
