const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

const orderSchema = {
  body: {
    type: 'object',
    required: ['customerName', 'amount'],
    properties: {
      customerName: { type: 'string', minLength: 2 },
      amount: { type: 'number', minimum: 0 },
      items: { type: 'array' },
      dueDate: { type: 'string', format: 'date-time' },
      note: { type: 'string' }
    }
  }
};

async function orderRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { status, search } = request.query;
    const where = { businessId: request.user.businessId };
    if (status) where.status = status;
    if (search) where.customerName = { contains: search };
    const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' } });
    return sendSuccess(reply, orders);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: orderSchema }, async (request, reply) => {
    const { customerName, items, amount, dueDate, note } = request.body;
    const count = await prisma.order.count({ where: { businessId: request.user.businessId } });
    const orderNo = `ORD-${String(count + 1).padStart(3, '0')}`;
    const order = await prisma.order.create({
      data: { orderNo, businessId: request.user.businessId, customerName, items: JSON.stringify(items || []), amount: parseFloat(amount), dueDate: dueDate ? new Date(dueDate) : null, note },
    });
    return sendSuccess(reply, order, 201);
  });

  fastify.put('/:id/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { status } = request.body;
    const order = await prisma.order.updateMany({ 
      where: { id: parseInt(request.params.id), businessId: request.user.businessId }, 
      data: { status } 
    });
    if (order.count === 0) return sendError(reply, 'Buyurtma topilmadi', 404);
    const updated = await prisma.order.findUnique({ where: { id: parseInt(request.params.id) } });
    return sendSuccess(reply, updated);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { customerName, amount, dueDate, note, status } = request.body;
    const order = await prisma.order.updateMany({
      where: { id: parseInt(request.params.id), businessId: request.user.businessId },
      data: { customerName, amount: amount ? parseFloat(amount) : undefined, dueDate: dueDate ? new Date(dueDate) : undefined, note, status },
    });
    if (order.count === 0) return sendError(reply, 'Buyurtma topilmadi', 404);
    const updated = await prisma.order.findUnique({ where: { id: parseInt(request.params.id) } });
    return sendSuccess(reply, updated);
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await prisma.order.updateMany({ 
      where: { id: parseInt(request.params.id), businessId: request.user.businessId }, 
      data: { status: 'cancelled' } 
    });
    if (result.count === 0) return sendError(reply, 'Buyurtma topilmadi', 404);
    return sendSuccess(reply, 'Buyurtma bekor qilindi');
  });
}

module.exports = orderRoutes;
