const prisma = require('../prisma');
const { sendSuccess } = require('../services/response.utility');

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
    const where = {};
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
    const s = await prisma.supplier.create({ data: { name, phone, category, region, address, note } });
    return sendSuccess(reply, s, 201);
  });

  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const s = await prisma.supplier.update({ where: { id: parseInt(request.params.id) }, data: request.body });
    return sendSuccess(reply, s);
  });

  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await prisma.supplier.update({ where: { id: parseInt(request.params.id) }, data: { isActive: false } });
    return sendSuccess(reply, 'Ta\'minotchi o\'chirildi');
  });
}

module.exports = supplierRoutes;
