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
    const where = { businessId: request.user.businessId };
    
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

  // POST /api/expenses — SEC-10: Faqat ADMIN va MANAGER xarajat qo'sha oladi
  fastify.post('/', { preHandler: [fastify.authenticate], schema: expenseSchema }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
      return sendError(reply, 'Xarajat qo\'shish uchun ADMIN yoki MANAGER huquqi kerak', 403);
    }
    const { amount, category, description, date } = request.body;
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        businessId: request.user.businessId,
        description,
        date: date ? new Date(date) : new Date(),
        userId: request.user.id
      }
    });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      businessId: request.user.businessId,
      action: 'CREATE_EXPENSE',
      entityType: 'Expense',
      entityId: expense.id,
      newData: expense
    });

    return sendSuccess(reply, expense, 201);
  });

  // DELETE /api/expenses/:id — SEC-10: Faqat ADMIN o'chira oladi
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Xarajatni o\'chirish uchun ADMIN huquqi kerak', 403);
    }
    const id = parseInt(request.params.id);
    
    const oldExpense = await prisma.expense.findFirst({ where: { id, businessId: request.user.businessId } });
    if (!oldExpense) return sendError(reply, 'Xarajat topilmadi', 404);

    await prisma.expense.delete({ where: { id } });

    // AUDIT LOG
    logAction({
      userId: request.user.id,
      businessId: request.user.businessId,
      action: 'DELETE_EXPENSE',
      entityType: 'Expense',
      entityId: id,
      oldData: oldExpense
    });

    return sendSuccess(reply, 'Xarajat o\'chirildi');
  });

  // GET /api/expenses/summary — Dashbord uchun
  fastify.get('/summary', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenses = await prisma.expense.aggregate({
      where: { businessId: request.user.businessId, date: { gte: firstDayOfMonth } },
      _sum: { amount: true }
    });

    return sendSuccess(reply, {
      monthlyTotal: monthlyExpenses._sum.amount || 0
    });
  });
}

module.exports = expenseRoutes;
