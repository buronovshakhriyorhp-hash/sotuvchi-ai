const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

async function auditRoutes(fastify) {
  // GET /api/audit — Admin va Menejerlar uchun tizim o'zgarishlarini ko'rish
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Faqat ADMIN va MANAGER ko'ra oladi
    if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
      return sendError(reply, 'Bu ma\'lumotlarni ko\'rish uchun huquqingiz yetarli emas', 403);
    }

    const { page = 1, limit = 50, action, entityType, userId } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = parseInt(userId);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendSuccess(reply, { logs, total, page: parseInt(page), limit: parseInt(limit) });
  });

  // GET /api/audit/stats — Monitoring uchun statistikalar
  fastify.get('/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Faqat Admin ko\'ra oladi', 403);
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [criticalActions, activeUsers] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: last24h }, action: { in: ['DELETE_SALE', 'DELETE_PRODUCT', 'UPDATE_PRODUCT'] } }
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last24h } },
        _count: { id: true }
      })
    ]);

    return sendSuccess(reply, { criticalActionsLast24h: criticalActions, activeUsersCount: activeUsers.length });
  });
}

module.exports = auditRoutes;
