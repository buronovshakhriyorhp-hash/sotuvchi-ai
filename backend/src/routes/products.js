const ProductService = require('../services/product.service');
const { sendSuccess, sendError } = require('../services/response.utility');
const { processMultipart } = require('../services/upload.utility');

async function productRoutes(fastify) {
  // Shared Schema
  const productBodySchema = {
    type: 'object',
    required: ['sku', 'name', 'categoryId', 'sellPrice'],
    properties: {
      sku: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      categoryId: { type: ['number', 'string'] },
      costPrice: { type: ['number', 'string'] },
      sellPrice: { type: ['number', 'string'] },
      wholesalePrice: { type: ['number', 'string'] },
      stock: { type: ['number', 'string'] },
      minStock: { type: ['number', 'string'] },
      unit: { type: 'string' },
      barcode: { type: 'string', nullable: true },
      packageName: { type: 'string', nullable: true },
      packageQty: { type: ['number', 'string'], nullable: true },
      packageWeight: { type: ['number', 'string'], nullable: true },
      isActive: { type: ['boolean', 'string'] }
    }
  };

  // GET /api/products
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const result = await ProductService.getAllProducts(request.query);
    return sendSuccess(reply, result);
  });

  // GET /api/products/:id
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const product = await ProductService.getProductById(request.params.id);
      return sendSuccess(reply, product);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 404);
    }
  });

  // POST /api/products
  fastify.post('/', { 
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      let data = {};
      let imageUrl = null;
      const contentType = request.headers['content-type'] || '';

      if (contentType.includes('multipart/form-data')) {
        const result = await processMultipart(request, 'products');
        data = result.fields;
        imageUrl = result.imageUrl;
      } else {
        data = request.body || {};
      }

      if (!data.name || !data.categoryId || !data.sellPrice) {
         return sendError(reply, 'Majburiy maydonlarni (Nomi, Turkumi, Shtrix-kod, Narxi) to\'ldiring', 400);
      }

      const product = await ProductService.createProduct(data, request.user.id, imageUrl);
      return sendSuccess(reply, product, 201);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // PUT /api/products/:id
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      let data = {};
      let imageUrl = undefined;
      const contentType = request.headers['content-type'] || '';

      if (contentType.includes('multipart/form-data')) {
        const result = await processMultipart(request, 'products');
        data = result.fields;
        imageUrl = result.imageUrl;
      } else {
        data = request.body || {};
      }

      const product = await ProductService.updateProduct(id, data, request.user.id, imageUrl);
      return sendSuccess(reply, product);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // DELETE /api/products/:id
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      await ProductService.deleteProduct(request.params.id, request.user.id);
      return sendSuccess(reply, 'Mahsulot o\'chirildi');
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });
}

module.exports = productRoutes;

