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
      // method: to'lov turi — enum bilan validatsiya qilinadi
      method: { type: 'string', enum: ['cash', 'card', 'bank', 'transfer'], default: 'cash' },
      note:   { type: 'string', maxLength: 500 }
    }
  }
};

async function debtRoutes(fastify) {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { type, status } = request.query;
    const where = { businessId: request.user.businessId };
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

    // Auto mark overdue in DB (batch update debts that are past due)
    const now = new Date();
    const overdueIds = debts
      .filter(d => d.status === 'pending' || d.status === 'partial')
      .filter(d => new Date(d.dueDate) < now)
      .map(d => d.id);

    if (overdueIds.length > 0) {
      await prisma.debt.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: 'overdue' }
      });
    }

    const result = debts.map(d => ({
      ...d,
      remaining: Math.round((d.amount - d.paidAmount) * 100) / 100,
      isOverdue: d.status !== 'paid' && d.status !== 'cancelled' && new Date(d.dueDate) < now,
      // Reflect the updated status
      status: overdueIds.includes(d.id) ? 'overdue' : d.status,
    }));

    return sendSuccess(reply, result);
  });

  fastify.post('/', { preHandler: [fastify.authenticate], schema: debtSchema }, async (request, reply) => {
    const { type, customerId, supplierId, amount, dueDate, note } = request.body;
    const debt = await prisma.debt.create({
      data: { type, businessId: request.user.businessId, customerId: customerId ? parseInt(customerId) : null, supplierId: supplierId ? parseInt(supplierId) : null, amount: parseFloat(amount), dueDate: new Date(dueDate), note },
    });
    return sendSuccess(reply, debt, 201);
  });

  // POST /api/debts/:id/pay
  fastify.post('/:id/pay', { preHandler: [fastify.authenticate], schema: paySchema }, async (request, reply) => {
    const debtId = parseInt(request.params.id);
    const { amount, method, note } = request.body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return reply.status(400).send({ success: false, error: "To'lov miqdori musbat bo'lishi kerak" });
    }

    const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: request.user.businessId } });
    if (!debt) return sendError(reply, 'Qarz topilmadi', 404);
    if (debt.status === 'paid') return sendError(reply, "Bu qarz allaqachon to'liq to'langan", 400);
    if (debt.status === 'cancelled') return sendError(reply, "Bekor qilingan qarzga to'lov qilish mumkin emas", 400);

    const remaining = debt.amount - debt.paidAmount;
    const payAmt    = Math.min(payAmount, remaining);
    const newPaid   = parseFloat((debt.paidAmount + payAmt).toFixed(2));
    const newStatus = newPaid >= debt.amount ? 'paid' : 'partial';

    // method va note ajratilgan — oldin ikkalasi method ga tushib ketardi (kritik xato)
    const payMethod = method || 'cash';                         // "cash" | "card" | "bank" | "transfer"
    const payNote   = note ? note.substring(0, 500) : null;    // ixtiyoriy izoh

    const [updatedDebt, payment] = await prisma.$transaction([
      prisma.debt.update({ where: { id: debtId }, data: { paidAmount: newPaid, status: newStatus } }),
      prisma.payment.create({
        data: {
          debtId,
          businessId: request.user.businessId,
          customerId: debt.customerId,
          supplierId: debt.supplierId,
          amount:     payAmt,
          method:     payMethod,   // ← To'lov turi: "cash", "card", "bank"
          note:       payNote      // ← Izoh alohida maydonda
        },
      }),
    ]);

    return sendSuccess(reply, { debt: updatedDebt, payment });
  });

  // PUT /api/debts/:id
  fastify.put('/:id', { preHandler: [fastify.authenticate], schema: debtSchema }, async (request, reply) => {
    const debtId = parseInt(request.params.id);
    const { type, customerId, supplierId, amount, dueDate, note } = request.body;
    
    const existing = await prisma.debt.findFirst({ where: { id: debtId, businessId: request.user.businessId } });
    if (!existing) return sendError(reply, 'Qarz topilmadi', 404);

    const updated = await prisma.debt.update({
      where: { id: debtId },
      data: {
        type,
        customerId: customerId ? parseInt(customerId) : null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        note
      }
    });

    return sendSuccess(reply, updated);
  });

  fastify.get('/summary', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const now = new Date();
    
    // Fetch pending debts to accurately calculate remaining amount
    const pendingDebts = await prisma.debt.findMany({
      where: { businessId: request.user.businessId, status: { not: 'paid' } },
      select: { amount: true, paidAmount: true }
    });
    
    let totalPending = 0;
    for(const d of pendingDebts) {
      totalPending += (d.amount - d.paidAmount);
    }

    const [overdue, paid] = await Promise.all([
      prisma.debt.count({ where: { businessId: request.user.businessId, status: { not: 'paid' }, dueDate: { lt: now } } }),
      prisma.debt.count({ where: { businessId: request.user.businessId, status: 'paid' } }),
    ]);
    
    return sendSuccess(reply, { totalPending, overdueCount: overdue, paidCount: paid });
  });
}

module.exports = debtRoutes;
