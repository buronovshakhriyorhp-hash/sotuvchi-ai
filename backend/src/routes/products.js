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
    const result = await ProductService.getAllProducts(request.query, request.user.businessId);
    return sendSuccess(reply, result);
  });

  // GET /api/products/:id
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const product = await ProductService.getProductById(request.params.id, request.user.businessId);
      return sendSuccess(reply, product);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 404);
    }
  });

  // POST /api/products — SEC-10: Faqat ADMIN/MANAGER mahsulot qo'sha oladi
  fastify.post('/', { 
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
      return sendError(reply, 'Mahsulot qo\'shish uchun ADMIN yoki MANAGER huquqi kerak', 403);
    }
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

      const product = await ProductService.createProduct(data, request.user.id, request.user.businessId, imageUrl);
      return sendSuccess(reply, product, 201);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // PUT /api/products/:id — SEC-10: Faqat ADMIN/MANAGER tahrirlashi mumkin
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
      return sendError(reply, 'Mahsulotni tahrirlash uchun ADMIN yoki MANAGER huquqi kerak', 403);
    }
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

      const product = await ProductService.updateProduct(id, data, request.user.id, request.user.businessId, imageUrl);
      return sendSuccess(reply, product);
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // DELETE /api/products/:id — SEC-10: Faqat ADMIN o'chira oladi
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return sendError(reply, 'Mahsulot o\'chirish uchun ADMIN huquqi kerak', 403);
    }
    try {
      await ProductService.deleteProduct(request.params.id, request.user.id, request.user.businessId);
      return sendSuccess(reply, 'Mahsulot o\'chirildi');
    } catch (error) {
      return sendError(reply, error.message, error.statusCode || 400);
    }
  });

  // GET /api/products/import/template
  fastify.get('/import/template', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const xlsx = require('xlsx');
      const headers = ['Nomi', 'Artikul', 'Turkum', 'Tan narxi', 'Sotish narxi', 'Ulgurji narx', 'Soni', 'Birlik', 'Shtrixkod'];
      const rows = [
        ['Olma qizil', 'APP-101', 'Mevalar', 10000, 15000, 14000, 100, 'kg', '4780012345678'],
        ['Coca Cola 1.5L', 'CC-15L', 'Ichimliklar', 9000, 12000, 11000, 50, 'dona', '4780000000001'],
        ['Snickers', 'SN-01', 'Shirinliklar', 5000, 7000, 6500, 200, 'dona', '4780000000002']
      ];
      const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Mahsulotlar");
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', 'attachment; filename="nexus_mahsulot_shablon.xlsx"');
      return reply.send(buffer);
    } catch (error) {
      return sendError(reply, 'Shablon yaratishda xatolik yuz berdi: ' + error.message, 500);
    }
  });

  // POST /api/products/import — SEC-10: Faqat ADMIN/MANAGER import qilishi mumkin
  fastify.post('/import', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    if (!['ADMIN', 'MANAGER'].includes(request.user.role)) {
      return sendError(reply, 'Import qilish uchun ADMIN yoki MANAGER huquqi kerak', 403);
    }
    try {
      const ProductImportService = require('../services/product-import.service');
      const parts = request.parts();
      let excelBuffer = null;
      let zipBuffer = null;
      let targetWarehouseId = null;

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks = [];
          for await (const chunk of part.file) chunks.push(chunk);
          const buffer = Buffer.concat(chunks);
          
          if (part.fieldname === 'excel') excelBuffer = buffer;
          else if (part.fieldname === 'zip') zipBuffer = buffer;
        } else {
          if (part.fieldname === 'warehouseId') targetWarehouseId = part.value;
        }
      }

      if (!excelBuffer) return sendError(reply, 'Excel fayli yuklanishi shart', 400);

      const result = await ProductImportService.importProducts({
        excelBuffer,
        zipBuffer,
        userId: request.user.id,
        businessId: request.user.businessId,
        targetWarehouseId
      });

      return sendSuccess(reply, result);
    } catch (error) {
      return sendError(reply, error.message, 400);
    }
  });
}

module.exports = productRoutes;

