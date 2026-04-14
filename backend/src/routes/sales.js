const SaleService = require('../services/sale.service');
const { sendSuccess, sendError } = require('../services/response.utility');
const prisma = require('../prisma');

const saleSchema = {
  body: {
    type: 'object',
    required: ['items', 'warehouseId', 'paymentMethod'],
    properties: {
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'integer' },
            quantity: { type: 'number', minimum: 0.001 },
            unitPrice: { type: 'number' }
          }
        }
      },
      customerId: { type: ['integer', 'null'] },
      warehouseId: { type: 'integer' },
      discount: { type: 'number', default: 0 },
      discountType: { type: 'string', enum: ['percent', 'amount'], default: 'percent' },
      paymentMethod: { type: 'string', enum: ['cash', 'card', 'bank', 'debt', 'mixed'] },
      cashAmount: { type: 'number', default: 0 },
      cardAmount: { type: 'number', default: 0 },
      bankAmount: { type: 'number', default: 0 },
      debtAmount: { type: 'number', default: 0 },
      note: { type: 'string' }
    }
  }
};

async function saleRoutes(fastify) {
  // GET /api/sales
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = 1, limit = 50, method, status, from, to, search, today: todayOnly } = request.query;
    const cacheKey = `sales:list:${method || 'all'}:${status || 'all'}:${from || 'all'}:${to || 'all'}:${search || 'none'}:${todayOnly || 'all'}:${page}:${limit}`;
    
    // Try cache first
    const cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (method) where.paymentMethod = method;
    if (status) where.status = status;

    // `today=true` shortcut — kassir kunlik savdolarni ko'rish uchun
    if (todayOnly === 'true' || todayOnly === '1') {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    } else if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59');
    }
    if (search) {
      where.OR = [
        { receiptNo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    where.businessId = request.user.businessId;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          id: true,
          receiptNo: true,
          cashierId: true,
          customerId: true,
          subtotal: true,
          discount: true,
          discountAmt: true,
          total: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: { 
            select: { 
              id: true,
              productId: true,
              quantity: true,
              unitPrice: true,
              total: true,
              product: { select: { id: true, name: true, sku: true } } 
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.sale.count({ where }),
    ]);

    const result = { sales, total, page: parseInt(page), limit: parseInt(limit) };
    
    // Cache for 3 minutes (sales list changes frequently)
    await fastify.cache.set(cacheKey, result, 180);
    return sendSuccess(reply, result);
  });

  // GET /api/sales/:id
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const cacheKey = `sale:${request.params.id}`;
    
    // Try cache first
    const cached = await fastify.cache.get(cacheKey);
    if (cached) return sendSuccess(reply, cached);

    const sale = await prisma.sale.findFirst({
      where: { id: parseInt(request.params.id), businessId: request.user.businessId },
      include: {
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: { 
          include: { 
            product: { select: { id: true, name: true, sku: true, sellPrice: true } }
          }
        },
      },
    });
    if (!sale) return sendError(reply, 'Sotuv topilmadi', 404);
    
    // Cache for 30 minutes (detail page)
    await fastify.cache.set(cacheKey, sale, 1800);
    return sendSuccess(reply, sale);
  });

  // POST /api/sales
  fastify.post('/', { preHandler: [fastify.authenticate], schema: saleSchema }, async (request, reply) => {
    try {
      const sale = await SaleService.createSale(request.body, request.user.id, request.user.businessId);
      
      // Invalidate cache on write (businessId majburiy — multi-tenant kesh izolyatsiyasi)
      const bId = request.user.businessId;
      await fastify.cache.invalidateEntity('sales', bId);
      await fastify.cache.invalidateEntity('report', bId);
      
      return sendSuccess(reply, sale, 201);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // DELETE /api/sales/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { note } = request.query;
      const result = await SaleService.cancelSale(parseInt(request.params.id), request.user.id, request.user.businessId, note);
      
      // Invalidate cache on delete (businessId majburiy — multi-tenant kesh izolyatsiyasi)
      const bId = request.user.businessId;
      await fastify.cache.invalidateEntity('sales', bId);
      await fastify.cache.invalidateEntity('report', bId);
      await fastify.cache.del(`sale:${request.params.id}`);
      
      return sendSuccess(reply, 'Sotuv muvaffaqiyatli bekor qilindi');
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });
}

module.exports = saleRoutes;
