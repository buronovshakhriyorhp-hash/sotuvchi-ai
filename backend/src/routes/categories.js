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
      const category = await prisma.category.create({ data: { name } });
      return sendSuccess(reply, category, 201);
    } catch {
      return sendError(reply, 'Bu nomli turkum allaqachon mavjud', 400);
    }
  });

  // PUT /api/categories/:id
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { name } = request.body;
    const id = parseInt(request.params.id);
    const category = await prisma.category.update({
      where: { id },
      data: { name }
    });
    return sendSuccess(reply, category);
  });

  // DELETE /api/categories/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    try {
      await prisma.category.delete({ where: { id } });
      return sendSuccess(reply, 'Turkum o\'chirildi');
    } catch {
      return sendError(reply, 'Turkumni o\'chirib bo\'lmadi. Unda mahsulotlar bor.', 400);
    }
  });
}

module.exports = categoryRoutes;
