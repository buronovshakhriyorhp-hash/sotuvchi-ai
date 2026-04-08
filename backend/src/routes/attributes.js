const prisma = require('../prisma');
const { sendSuccess, sendError } = require('../services/response.utility');

const attributeSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 }
    }
  }
};

const valueSchema = {
  body: {
    type: 'object',
    required: ['attributeId', 'value'],
    properties: {
      attributeId: { type: 'integer' },
      value: { type: 'string', minLength: 1 }
    }
  }
};

async function attributeRoutes(fastify) {
  // GET /api/attributes
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const attributes = await prisma.attribute.findMany({
      include: {
        values: true,
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(reply, attributes);
  });

  // POST /api/attributes
  fastify.post('/', { preHandler: [fastify.authenticate], schema: attributeSchema }, async (request, reply) => {
    const { name } = request.body;
    try {
      const attribute = await prisma.attribute.create({ data: { name } });
      return sendSuccess(reply, attribute, 201);
    } catch {
      return sendError(reply, 'Bu nomli atribut allaqachon mavjud', 400);
    }
  });

  // POST /api/attributes/values
  fastify.post('/values', { preHandler: [fastify.authenticate], schema: valueSchema }, async (request, reply) => {
    const { attributeId, value } = request.body;
    const attrValue = await prisma.attributeValue.create({
      data: { 
        attributeId: parseInt(attributeId), 
        value 
      }
    });
    return sendSuccess(reply, attrValue, 201);
  });

  // DELETE /api/attributes/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const id = parseInt(request.params.id);
    await prisma.attribute.delete({ where: { id } });
    return sendSuccess(reply, 'Atribut o\'chirildi');
  });
}

module.exports = attributeRoutes;
