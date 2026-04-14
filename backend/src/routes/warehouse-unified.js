const warehouseService = require('../services/warehouse.service');
const stockService = require('../services/stock.service');
const { sendSuccess, sendError } = require('../services/response.utility');
const prisma = require('../prisma');

async function warehouseUnifiedRoutes(fastify) {
  // --- Warehouse Management (CRUD) ---

  // GET /api/warehouses
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const warehouses = await warehouseService.getAllWarehouses(request.user.businessId);
    return sendSuccess(reply, warehouses);
  });

  // POST /api/warehouses — SEC-10: Faqat ADMIN ombor yaratishi mumkin
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Ombor yaratish uchun ADMIN huquqi kerak', 403);
    }
    try {
      const warehouse = await warehouseService.createWarehouse(request.body, request.user.businessId);
      return sendSuccess(reply, warehouse, 201);
    } catch (error) {
      return sendError(reply, 'Bu nomli ombor allaqachon mavjud yoki ma\'lumotlar xato', 400);
    }
  });

  // PUT /api/warehouses/:id — SEC-10: Faqat ADMIN
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Ombor tahrirlash uchun ADMIN huquqi kerak', 403);
    }
    const warehouse = await warehouseService.updateWarehouse(request.params.id, request.body, request.user.businessId);
    return sendSuccess(reply, warehouse);
  });

  // DELETE /api/warehouses/:id — SEC-10: Faqat ADMIN
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Ombor o\'chirish uchun ADMIN huquqi kerak', 403);
    }
    try {
      await warehouseService.deleteWarehouse(request.params.id, request.user.businessId);
      return sendSuccess(reply, 'Ombor o\'chirildi');
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // --- Stock & Inventory Management ---

  // GET /api/warehouses/stock
  fastify.get('/stock', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { warehouseId, productId } = request.query;
    const where = { warehouse: { businessId: request.user.businessId } };
    if (warehouseId) where.warehouseId = parseInt(warehouseId);
    if (productId) where.productId = parseInt(productId);

    const stocks = await prisma.productStock.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, sellPrice: true, minStock: true } },
        warehouse: { select: { id: true, name: true } }
      },
      orderBy: { quantity: 'desc' }
    });
    return sendSuccess(reply, stocks);
  });

  // POST /api/warehouses/transaction — SEC-10: ADMIN/MANAGER/STOREKEEPER
  fastify.post('/transaction', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER', 'STOREKEEPER'].includes(request.user.role)) {
      return sendError(reply, 'Stock tranzaksiyasi uchun ruxsat yo\'q', 403);
    }
    const { productId, warehouseId, quantity, type, reason } = request.body;
    
    // Validation
    if (!productId || !warehouseId || !quantity || !type) {
      return sendError(reply, 'Barcha maydonlar to\'ldirilishi shart', 400);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const qtyChange = type.toUpperCase() === 'IN' ? parseFloat(quantity) : -parseFloat(quantity);
        
        if (type.toUpperCase() === 'OUT') {
           const available = await stockService.checkAvailability(productId, warehouseId, quantity, request.user.businessId);
           if (!available) throw new Error('Omborda yetarli mahsulot yo\'q');
        }

        return await stockService.adjustStock({
          productId,
          warehouseId,
          businessId: request.user.businessId,
          quantity: qtyChange,
          type: type.toUpperCase(),
          reason: reason || `Qo'lda kiritilgan tranzaktsiya: ${type}`,
          userId: request.user.id
        }, tx);
      });

      return sendSuccess(reply, result, 201);
    } catch (error) {
      return sendError(reply, error.message, 400);
    }
  });

  // POST /api/warehouses/transfer — SEC-10: ADMIN/MANAGER/STOREKEEPER
  fastify.post('/transfer', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER', 'STOREKEEPER'].includes(request.user.role)) {
      return sendError(reply, 'O\'tkazma bajarish uchun ruxsat yo\'q', 403);
    }
    const { productId, fromWarehouseId, toWarehouseId, quantity, reason } = request.body;
    
    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return sendError(reply, 'Barcha maydonlar to\'ldirilishi shart', 400);
    }

    try {
      await stockService.transferStock({
        productId,
        fromWarehouseId,
        toWarehouseId,
        businessId: request.user.businessId,
        quantity,
        reason,
        userId: request.user.id
      });
      return sendSuccess(reply, 'O\'tkazma muvaffaqiyatli bajarildi');
    } catch (error) {
      return sendError(reply, error.message, 400);
    }
  });

  // GET /api/warehouses/transactions
  fastify.get('/transactions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { warehouseId, productId, type, page = 1, limit = 50 } = request.query;
    const where = { warehouse: { businessId: request.user.businessId } };
    if (warehouseId) where.warehouseId = parseInt(warehouseId);
    if (productId) where.productId = parseInt(productId);
    if (type) where.type = type.toUpperCase();

    const [txs, total] = await Promise.all([
      prisma.warehouseTx.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.warehouseTx.count({ where })
    ]);

    return sendSuccess(reply, { txs, total, page: parseInt(page), limit: parseInt(limit) });
  });

  // POST /api/warehouses/reconcile — SEC-10: Faqat ADMIN/MANAGER
  fastify.post('/reconcile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
      return sendError(reply, 'Qayta hisoblash uchun ADMIN yoki MANAGER huquqi kerak', 403);
    }
    const { productId, warehouseId, realQuantity } = request.body;
    
    if (!productId || !warehouseId || realQuantity === undefined) {
      return sendError(reply, 'Barcha maydonlar to\'ldirilishi shart', 400);
    }

    try {
      const result = await stockService.reconcileStock({
        productId,
        warehouseId,
        businessId: request.user.businessId,
        realQuantity,
        userId: request.user.id
      });
      return sendSuccess(reply, result);
    } catch (error) {
      return sendError(reply, error.message, 400);
    }
  });
}

module.exports = warehouseUnifiedRoutes;
