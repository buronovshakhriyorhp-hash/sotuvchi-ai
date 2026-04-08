const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');
const { logAction } = require('../services/audit.service');

const expenseSchema = {
  body: {
    type: 'object',
    required: ['amount', 'category'],
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      category: { type: 'string' }, // Rent, Salary, Utility, Food, Other
      description: { type: 'string' },
      date: { type: 'string', format: 'date-time' }
    }
  }
};

async function expenseRoutes(fastify) {
  // GET /api/expenses
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { from, to, category } = request.query;
    const where = {};
    
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to + 'T23:59:59');
    }
    
    if (category) where.category = category;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' }
      }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      })
    ]);

    return sendSuccess(reply, { 
      expenses, 
      totalAmount: total._sum.amount || 0 
    });
  });

  // POST /api/expenses
  fastify.post('/', { preHandler: [fastify.authenticate], schema: expenseSchema }, async (request, reply) => {
    const { amount, category, description, date } = request.body;
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        description,
        date: date ? new Date(date) : new Date(),
        userId: request.user.id
      }
    });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      action: 'CREATE_EXPENSE',
      entityType: 'Expense',
      entityId: expense.id,
      newData: expense
    });

    return sendSuccess(reply, expense, 201);
  });

  // DELETE /api/expenses/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    
    const oldExpense = await prisma.expense.findUnique({ where: { id } });
    if (!oldExpense) return sendError(reply, 'Xarajat topilmadi', 404);

    await prisma.expense.delete({ where: { id } });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      action: 'DELETE_EXPENSE',
      entityType: 'Expense',
      entityId: id,
      oldData: oldExpense
    });

    return sendSuccess(reply, 'Xarajat o\'chirildi');
  });

  // GET /api/expenses/summary — Dashbord uchun
  fastify.get('/summary', { preHandler: [fastify.authenticate] }, async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenses = await prisma.expense.aggregate({
      where: { date: { gte: firstDayOfMonth } },
      _sum: { amount: true }
    });

    return sendSuccess(reply, {
      monthlyTotal: monthlyExpenses._sum.amount || 0
    });
  });
}

module.exports = expenseRoutes;
