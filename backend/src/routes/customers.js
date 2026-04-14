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
    const where = { businessId: request.user.businessId };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
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
    const c = await prisma.customer.findFirst({
      where: { id: parseInt(request.params.id), businessId: request.user.businessId },
      include: { sales: { take: 10, orderBy: { createdAt: 'desc' } }, debts: true, payments: true },
    });
    if (!c) return sendError(reply, 'Mijoz topilmadi', 404);
    return sendSuccess(reply, c);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: customerSchema }, async (request, reply) => {
    const { name, phone, type, region, address, note } = request.body;
    
    // Telefon raqami bo'yicha dublikatni tekshirish (SaaS scoped)
    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { phone, businessId: request.user.businessId, isActive: true } });
      if (existing) {
        return sendError(reply, `Ushbu telefon raqami (${phone}) allaqachon "${existing.name}" nomi bilan ro'yxatga olingan!`, 400);
      }
    }

    const c = await prisma.customer.create({ data: { name, phone, businessId: request.user.businessId, type: type || 'individual', region, address, note } });
    return sendSuccess(reply, c, 201);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);

    // SEC-05: Mass Assignment himoyasi — faqat ruxsat etilgan maydonlar
    // request.body ni to'g'ridan-to'g'ri uzatish TAQIQLANGAN (businessId injection xavfi)
    const { name, phone, type, region, address, note } = request.body || {};
    const data = {};
    if (name !== undefined)    data.name    = name;
    if (phone !== undefined)   data.phone   = phone;
    if (type !== undefined)    data.type     = type;
    if (region !== undefined)  data.region  = region;
    if (address !== undefined) data.address = address;
    if (note !== undefined)    data.note    = note;

    if (Object.keys(data).length === 0) {
      return sendError(reply, 'O\'zgartirish uchun kamida bitta maydon kerak', 400);
    }

    const c = await prisma.customer.updateMany({ 
      where: { id, businessId: request.user.businessId }, 
      data
    });
    if (c.count === 0) return sendError(reply, 'Mijoz topilmadi', 404);
    const updated = await prisma.customer.findUnique({ where: { id } });
    return sendSuccess(reply, updated);
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    const result = await prisma.customer.updateMany({ 
      where: { id, businessId: request.user.businessId }, 
      data: { isActive: false } 
    });
    if (result.count === 0) return sendError(reply, 'Mijoz topilmadi', 404);
    return sendSuccess(reply, 'Mijoz o\'chirildi');
  });
}

module.exports = customerRoutes;
