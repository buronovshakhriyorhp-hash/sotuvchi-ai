const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const supplierSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 },
      phone: { type: 'string' },
      category: { type: 'string' },
      region: { type: 'string' },
      address: { type: 'string' },
      note: { type: 'string' }
    }
  }
};

async function supplierRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { search } = request.query;
    const where = { businessId: request.user.businessId };
    if (search) where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        debts: { where: { status: { not: 'paid' } }, select: { amount: true, paidAmount: true } },
      },
      orderBy: { name: 'asc' },
    });
    const result = suppliers.map(s => ({
      ...s,
      debt: s.debts.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0),
    }));
    return sendSuccess(reply, result);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: supplierSchema }, async (request, reply) => {
    const { name, phone, category, region, address, note } = request.body;
    const s = await prisma.supplier.create({ data: { name, phone, category, region, address, note, businessId: request.user.businessId } });
    return sendSuccess(reply, s, 201);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // SEC-05: Mass Assignment himoyasi — faqat ruxsat etilgan maydonlar
    const { name, phone, category, region, address, note } = request.body || {};
    const data = {};
    if (name !== undefined)     data.name     = name;
    if (phone !== undefined)    data.phone    = phone;
    if (category !== undefined) data.category = category;
    if (region !== undefined)   data.region   = region;
    if (address !== undefined)  data.address  = address;
    if (note !== undefined)     data.note     = note;

    if (Object.keys(data).length === 0) {
      return sendError(reply, 'O\'zgartirish uchun kamida bitta maydon kerak', 400);
    }

    const s = await prisma.supplier.updateMany({ 
      where: { id: parseInt(request.params.id), businessId: request.user.businessId }, 
      data
    });
    if (s.count === 0) return sendError(reply, 'Ta\'minotchi topilmadi', 404);
    const updated = await prisma.supplier.findUnique({ where: { id: parseInt(request.params.id) } });
    return sendSuccess(reply, updated);
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await prisma.supplier.updateMany({ 
      where: { id: parseInt(request.params.id), businessId: request.user.businessId }, 
      data: { isActive: false } 
    });
    if (result.count === 0) return sendError(reply, 'Ta\'minotchi topilmadi', 404);
    return sendSuccess(reply, 'Ta\'minotchi o\'chirildi');
  });
}

module.exports = supplierRoutes;
