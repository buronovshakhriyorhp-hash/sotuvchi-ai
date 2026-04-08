const prisma = require('../prisma');
const cache = require('../utils/cache');
const { logAction } = require('./audit.service');

class ProductService {
  async getAllProducts(query) {
    const { search, categoryId, status, page = 1, limit = 50 } = query;
    const cacheKey = `products:list:${search || 'all'}:${categoryId || 'all'}:${status || 'all'}:${page}:${limit}`;
    
    // Try cache first (cache list queries for 5 minutes)
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    // Use select instead of include for better performance
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          categoryId: true,
          costPrice: true,
          sellPrice: true,
          wholesalePrice: true,
          stock: true,
          minStock: true,
          unit: true,
          barcode: true,
          image: true,
          isActive: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    const result = { products, total, page: parseInt(page), limit: parseInt(limit) };
    
    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);
    return result;
  }

  async getProductById(id) {
    const cacheKey = `product:${id}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { 
        category: { select: { id: true, name: true } },
        stocks: { 
          include: { warehouse: { select: { id: true, name: true } } },
          select: { id: true, quantity: true, warehouse: true }
        } 
      },
    });
    if (!product) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });
    
    // Cache for 10 minutes
    await cache.set(cacheKey, product, 600);
    return product;
  }

  async createProduct(data, userId, imageUrl = null) {
    const { 
      sku, name, categoryId, costPrice, sellPrice, wholesalePrice, stock, minStock, unit, barcode,
      packageName, packageQty, packageWeight, warehouseId
    } = data;

    const parsedSku = String(sku || '').trim();
    if (!parsedSku) throw Object.assign(new Error('SKU kiritilishi shart'), { statusCode: 400 });

    // Check duplicate SKU
    const existing = await prisma.product.findFirst({ where: { sku: parsedSku } });
    if (existing) throw Object.assign(new Error(`Bu SKU (${parsedSku}) allaqachon mavjud`), { statusCode: 400 });

    if (barcode) {
      const barcodeExists = await prisma.product.findFirst({ where: { barcode: String(barcode) } });
      if (barcodeExists) throw Object.assign(new Error(`Bu barcode (${barcode}) allaqachon mavjud`), { statusCode: 400 });
    }

    const parsedStock = parseFloat(stock);
    const finalStock = isNaN(parsedStock) ? 0 : parsedStock;

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: parsedSku,
          name: String(name),
          categoryId: parseInt(categoryId),
          costPrice: parseFloat(costPrice) || 0,
          sellPrice: parseFloat(sellPrice) || 0,
          wholesalePrice: parseFloat(wholesalePrice) || 0,
          stock: finalStock,
          minStock: parseFloat(minStock) || 5,
          unit: unit || 'ta',
          barcode: barcode ? String(barcode) : null,
          packageName: packageName ? String(packageName) : null,
          packageQty: packageQty ? parseFloat(packageQty) : null,
          packageWeight: packageWeight ? parseFloat(packageWeight) : null,
          image: imageUrl,
          isActive: true,
        },
        include: { category: { select: { id: true, name: true } } },
      });

      // Stock handling
      let targetWarehouseId = parseInt(warehouseId);
      if (!targetWarehouseId) {
        const defaultWarehouse = await tx.warehouse.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
        if (defaultWarehouse) targetWarehouseId = defaultWarehouse.id;
      }

      if (targetWarehouseId) {
        const existingStock = await tx.productStock.findUnique({
          where: { productId_warehouseId: { productId: product.id, warehouseId: targetWarehouseId } }
        });

        if (existingStock) {
          await tx.productStock.update({
            where: { id: existingStock.id },
            data: { quantity: Number(finalStock) }
          });
        } else {
          await tx.productStock.create({
            data: { productId: product.id, warehouseId: targetWarehouseId, quantity: Number(finalStock) }
          });
        }

        if (finalStock !== 0) {
          await tx.warehouseTx.create({
            data: {
              type: finalStock > 0 ? 'IN' : 'OUT',
              productId: product.id,
              warehouseId: targetWarehouseId,
              quantity: Math.abs(finalStock),
              reason: 'Mahsulot yaratishdagi dastlabki qoldiq',
              userId
            }
          });
        }
      }

      logAction({
        userId,
        action: 'CREATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        newData: { name: product.name, sku: product.sku, stock: product.stock }
      });

      // Invalidate cache
      await cache.invalidateEntity('products');

      return product;
    });
  }

  async updateProduct(id, data, userId, imageUrl = undefined) {
    const { sku, name, categoryId, costPrice, sellPrice, wholesalePrice, stock, minStock, unit, barcode,
            packageName, packageQty, packageWeight, isActive, warehouseId } = data;

    const oldProduct = await prisma.product.findUnique({ 
      where: { id: parseInt(id) },
      include: { stocks: true }
    });
    if (!oldProduct) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });

    // Handle SKU update
    if (sku && sku !== oldProduct.sku) {
      const existing = await prisma.product.findFirst({ where: { sku: String(sku), NOT: { id: parseInt(id) } } });
      if (existing) throw Object.assign(new Error(`Bu SKU (${sku}) boshqa mahsulotda mavjud`), { statusCode: 400 });
    }

    const updateData = {
      ...(sku !== undefined && { sku: String(sku) }),
      ...(name !== undefined && { name: String(name) }),
      ...(categoryId !== undefined && { categoryId: parseInt(categoryId) }),
      ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) || 0 }),
      ...(sellPrice !== undefined && { sellPrice: parseFloat(sellPrice) || 0 }),
      ...(wholesalePrice !== undefined && { wholesalePrice: parseFloat(wholesalePrice) || 0 }),
      ...(stock !== undefined && { stock: parseFloat(stock) || 0 }),
      ...(minStock !== undefined && { minStock: parseFloat(minStock) || 0 }),
      ...(unit !== undefined && { unit: String(unit) }),
      ...(barcode !== undefined && { barcode: barcode ? String(barcode) : null }),
      ...(packageName !== undefined && { packageName: packageName ? String(packageName) : null }),
      ...(packageQty !== undefined && { packageQty: packageQty ? parseFloat(packageQty) : null }),
      ...(packageWeight !== undefined && { packageWeight: packageWeight ? parseFloat(packageWeight) : null }),
      ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(imageUrl !== undefined && { image: imageUrl }),
    };

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { category: { select: { id: true, name: true } } },
      });

      // Handle stock adjustments if stock was provided
      if (stock !== undefined) {
        const newWarehouseStock = parseFloat(stock) || 0;
        let targetWarehouseId = parseInt(warehouseId);
        
        if (!targetWarehouseId) {
          const defaultWarehouse = await tx.warehouse.findFirst({ where: { isActive: true }, orderBy: { id: 'asc' } });
          if (defaultWarehouse) targetWarehouseId = defaultWarehouse.id;
        }

        if (targetWarehouseId) {
          const currentStockRec = await tx.productStock.findUnique({
            where: { productId_warehouseId: { productId: product.id, warehouseId: targetWarehouseId } }
          });

          const currentQty = currentStockRec ? currentStockRec.quantity : 0;
          const diff = Number(newWarehouseStock) - currentQty;

          if (diff !== 0) {
            if (currentStockRec) {
              await tx.productStock.update({
                where: { id: currentStockRec.id },
                data: { quantity: Number(newWarehouseStock) }
              });
            } else {
              await tx.productStock.create({
                data: { productId: product.id, warehouseId: targetWarehouseId, quantity: Number(newWarehouseStock) }
              });
            }

            await tx.warehouseTx.create({
              data: {
                type: diff > 0 ? 'IN' : 'OUT',
                productId: product.id,
                warehouseId: targetWarehouseId,
                quantity: Math.abs(diff),
                reason: 'Mahsulot tahrirlash paytidagi qoldiqni to\'g\'rilash',
                userId
              }
            });

            // Recalculate global product stock
            const allStocks = await tx.productStock.findMany({
              where: { productId: product.id }
            });
            const totalStock = allStocks.reduce((sum, s) => sum + s.quantity, 0);
            
            await tx.product.update({
              where: { id: product.id },
              data: { stock: totalStock }
            });
          }
        }
      }

      logAction({
        userId,
        action: 'UPDATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        oldData: { name: oldProduct.name, sku: oldProduct.sku, stock: oldProduct.stock },
        newData: { name: product.name, sku: product.sku, stock: product.stock }
      });

      // Invalidate cache
      await cache.invalidateEntity('products');
      await cache.del(`product:${id}`);

      return product;
    });
  }

  async deleteProduct(id, userId) {
    const oldProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!oldProduct) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id: parseInt(id) }, data: { isActive: false } });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE_PRODUCT',
          entityType: 'Product',
          entityId: id,
          oldData: { isActive: true },
          newData: { isActive: false }
        }
      });

      // Invalidate cache
      await cache.invalidateEntity('products');
      await cache.del(`product:${id}`);

      return product;
    });
  }
}

module.exports = new ProductService();
