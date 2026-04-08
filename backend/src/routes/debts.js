const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const debtSchema = {
  body: {
    type: 'object',
    required: ['type', 'amount', 'dueDate'],
    properties: {
      type: { type: 'string', enum: ['customer', 'supplier'] },
      customerId: { type: ['integer', 'null'] },
      supplierId: { type: ['integer', 'null'] },
      amount: { type: 'number', minimum: 0 },
      dueDate: { type: 'string', format: 'date-time' },
      note: { type: 'string' }
    }
  }
};

const paySchema = {
  body: {
    type: 'object',
    required: ['amount'],
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      method: { type: 'string', enum: ['cash', 'card', 'bank'], default: 'cash' },
      note: { type: 'string' }
    }
  }
};

async function debtRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { type, status } = request.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const debts = await prisma.debt.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        supplier: { select: { id: true, name: true, phone: true } },
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    // Auto mark overdue
    const now = new Date();
    const result = debts.map(d => ({
      ...d,
      remaining: Math.round((d.amount - d.paidAmount) * 100) / 100,
      isOverdue: d.status !== 'paid' && new Date(d.dueDate) < now,
    }));

    return sendSuccess(reply, result);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: debtSchema }, async (request, reply) => {
    const { type, customerId, supplierId, amount, dueDate, note } = request.body;
    const debt = await prisma.debt.create({
      data: { type, customerId: customerId ? parseInt(customerId) : null, supplierId: supplierId ? parseInt(supplierId) : null, amount: parseFloat(amount), dueDate: new Date(dueDate), note },
    });
    return sendSuccess(reply, debt, 201);
  });

  // POST /api/debts/:id/pay
  fastify.post('/:id/pay', { preHandler: [fastify.authenticate], schema: paySchema }, async (request, reply) => {
    const debtId = parseInt(request.params.id);
    const { amount, method = 'cash', note } = request.body;

    if (!amount || parseFloat(amount) <= 0) {
      return reply.status(400).send({ success: false, error: 'To\'lov miqdori musbat bo\'lishi kerak' });
    }

    const debt = await prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt) return sendError(reply, 'Qarz topilmadi', 404);

    const payAmt = Math.min(parseFloat(amount), debt.amount - debt.paidAmount);
    const newPaid = Math.round((debt.paidAmount + payAmt) * 100) / 100;
    const newStatus = newPaid >= debt.amount ? 'paid' : 'partial';

    const [updatedDebt, payment] = await prisma.$transaction([
      prisma.debt.update({ where: { id: debtId }, data: { paidAmount: newPaid, status: newStatus } }),
      prisma.payment.create({
        data: {
          debtId,
          customerId: debt.customerId,
          supplierId: debt.supplierId,
          amount: payAmt,
          method,
          note,
        },
      }),
    ]);

    return sendSuccess(reply, { debt: updatedDebt, payment });
  });

  // GET /api/debts/summary
  fastify.get('/summary', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const [total, overdue, paid] = await Promise.all([
      prisma.debt.aggregate({ _sum: { amount: true }, where: { status: { not: 'paid' } } }),
      prisma.debt.count({ where: { status: 'overdue' } }),
      prisma.debt.count({ where: { status: 'paid' } }),
    ]);
    return sendSuccess(reply, { totalPending: total._sum.amount || 0, overdueCount: overdue, paidCount: paid });
  });
}

module.exports = debtRoutes;
