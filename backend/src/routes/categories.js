const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const categorySchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 }
    }
  }
};

async function categoryRoutes(fastify) {
  // GET /api/categories
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const categories = await prisma.category.findMany({
      where: { businessId: request.user.businessId },
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    });
    return sendSuccess(reply, categories);
  });

  // POST /api/categories
  fastify.post('/', { preHandler: [fastify.authenticate], schema: categorySchema }, async (request, reply) => {
    const { name } = request.body;
    try {
      const category = await prisma.category.create({ data: { name, businessId: request.user.businessId } });
      return sendSuccess(reply, category, 201);
    } catch {
      return sendError(reply, 'Bu nomli turkum allaqachon mavjud', 400);
    }
  });

  // PUT /api/categories/:id
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name } = request.body;
    const id = parseInt(request.params.id);
    const category = await prisma.category.updateMany({
      where: { id, businessId: request.user.businessId },
      data: { name }
    });
    if (category.count === 0) return sendError(reply, 'Turkum topilmadi', 404);
    const updated = await prisma.category.findUnique({ where: { id } });
    return sendSuccess(reply, updated);
  });

  // DELETE /api/categories/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    try {
      const result = await prisma.category.deleteMany({ where: { id, businessId: request.user.businessId } });
      if (result.count === 0) return sendError(reply, 'Turkum topilmadi', 404);
      return sendSuccess(reply, 'Turkum o\'chirildi');
    } catch {
      return sendError(reply, 'Turkumni o\'chirib bo\'lmadi. Unda mahsulotlar bor.', 400);
    }
  });
}

module.exports = categoryRoutes;
