const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

const warehouseTxSchema = {
  body: {
    type: 'object',
    required: ['productId', 'warehouseId', 'quantity', 'type'],
    properties: {
      productId: { type: 'integer' },
      warehouseId: { type: 'integer' },
      quantity: { type: 'number', minimum: 0.001 },
      type: { type: 'string', enum: ['IN', 'OUT'] },
      reason: { type: 'string' }
    }
  }
};

async function warehouseRoutes(fastify) {
  // GET /api/warehouse — transactions list
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { type, productId, warehouseId, page = 1, limit = 50 } = request.query;
    const where = {};
    if (type) where.type = type.toUpperCase();
    if (productId) where.productId = parseInt(productId);
    if (warehouseId) where.warehouseId = parseInt(warehouseId);

    const [txs, total] = await Promise.all([
      prisma.warehouseTx.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.warehouseTx.count({ where }),
    ]);

    return sendSuccess(reply, { txs, total });
  });

  // POST /api/warehouse — tranzaktsiya (IN | OUT)
  fastify.post('/', { preHandler: [fastify.authenticate], schema: warehouseTxSchema }, async (request, reply) => {
    const { productId, warehouseId, quantity, reason, type = 'IN' } = request.body;

    const txType = type.toUpperCase();
    if (!['IN', 'OUT'].includes(txType)) {
      return reply.status(400).send({ success: false, error: 'Turi (type) noto\'g\'ri: IN yoki OUT' });
    }

    const tx = await prisma.$transaction(async (prismaT) => {
      const product = await prismaT.product.findUnique({ where: { id: parseInt(productId) } });
      if (!product) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });

      const warehouse = await prismaT.warehouse.findUnique({ where: { id: parseInt(warehouseId) } });
      if (!warehouse) throw Object.assign(new Error('Ombor topilmadi'), { statusCode: 404 });

      const stock = await prismaT.productStock.findUnique({
        where: { productId_warehouseId: { productId: parseInt(productId), warehouseId: parseInt(warehouseId) } }
      });

      if (txType === 'OUT') {
        const currentQty = stock?.quantity || 0;
        if (currentQty < parseInt(quantity)) {
          throw Object.assign(new Error(`Omborda yetarli qoldiq yo'q (Mavjud: ${currentQty})`), { statusCode: 400 });
        }

        await prismaT.productStock.upsert({
          where: { productId_warehouseId: { productId: parseInt(productId), warehouseId: parseInt(warehouseId) } },
          update: { quantity: { decrement: parseInt(quantity) } },
          create: { productId: parseInt(productId), warehouseId: parseInt(warehouseId), quantity: 0 } // Should not happen with validation above
        });

        await prismaT.product.update({
          where: { id: parseInt(productId) },
          data: { stock: { decrement: parseInt(quantity) } },
        });
      } else {
        // IN
        await prismaT.productStock.upsert({
          where: { productId_warehouseId: { productId: parseInt(productId), warehouseId: parseInt(warehouseId) } },
          update: { quantity: { increment: parseInt(quantity) } },
          create: { productId: parseInt(productId), warehouseId: parseInt(warehouseId), quantity: parseInt(quantity) }
        });

        await prismaT.product.update({
          where: { id: parseInt(productId) },
          data: { stock: { increment: parseInt(quantity) } },
        });
      }

      return prismaT.warehouseTx.create({
        data: { 
          type: txType, 
          productId: parseInt(productId), 
          warehouseId: parseInt(warehouseId),
          quantity: parseInt(quantity), 
          reason, 
          userId: request.user.id 
        },
        include: { 
          product: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } }
        },
      });
    });

    return sendSuccess(reply, tx, 201);
  });

  // GET /api/warehouse/stock — current stock summary (per warehouse)
  fastify.get('/stock', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { warehouseId } = request.query;
    
    const stocks = await prisma.productStock.findMany({
      where: warehouseId ? { warehouseId: parseInt(warehouseId) } : {},
      include: {
        product: {
          select: { 
            id: true, sku: true, name: true, minStock: true, sellPrice: true, 
            category: { select: { name: true } } 
          }
        },
        warehouse: { select: { id: true, name: true } }
      },
      orderBy: { quantity: 'asc' }
    });

    const lowStock = stocks.filter(s => s.quantity <= s.product.minStock);
    const totalValue = stocks.reduce((sum, s) => sum + s.quantity * s.product.sellPrice, 0);

    return sendSuccess(reply, { stocks, lowStock, totalValue });
  });
}

module.exports = warehouseRoutes;
