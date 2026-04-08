const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const customerSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 },
      phone: { type: 'string' },
      type: { type: 'string', enum: ['individual', 'company'], default: 'individual' },
      region: { type: 'string' },
      address: { type: 'string' },
      note: { type: 'string' }
    }
  }
};

async function customerRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { search, type, page = 1, limit = 50 } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
    if (type) where.type = type;
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { sales: true } },
          debts: { where: { status: { not: 'paid' } }, select: { amount: true, paidAmount: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.customer.count({ where }),
    ]);
    // Compute balance
    const result = customers.map(c => ({
      ...c,
      totalOrders: c._count.sales,
      balance: -c.debts.reduce((s, d) => s + (d.amount - d.paidAmount), 0),
    }));
    return sendSuccess(reply, { customers: result, total, page: parseInt(page), limit: parseInt(limit) });
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const c = await prisma.customer.findUnique({
      where: { id: parseInt(request.params.id) },
      include: { sales: { take: 10, orderBy: { createdAt: 'desc' } }, debts: true, payments: true },
    });
    if (!c) return sendError(reply, 'Mijoz topilmadi', 404);
    return sendSuccess(reply, c);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: customerSchema }, async (request, reply) => {
    const { name, phone, type, region, address, note } = request.body;
    
    // Telefon raqami bo'yicha dublikatni tekshirish
    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { phone, isActive: true } });
      if (existing) {
        return sendError(reply, `Ushbu telefon raqami (${phone}) allaqachon "${existing.name}" nomi bilan ro'yxatga olingan!`, 400);
      }
    }

    const c = await prisma.customer.create({ data: { name, phone, type: type || 'individual', region, address, note } });
    return sendSuccess(reply, c, 201);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const c = await prisma.customer.update({ where: { id: parseInt(request.params.id) }, data: request.body });
    return sendSuccess(reply, c);
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await prisma.customer.update({ where: { id: parseInt(request.params.id) }, data: { isActive: false } });
    return sendSuccess(reply, 'Mijoz o\'chirildi');
  });
}

module.exports = customerRoutes;
