const prisma = require('../prisma');
const cache = require('../utils/cache');
const { logAction } = require('./audit.service');

class ProductService {
  async getAllProducts(query, businessId) {
    const { search, categoryId, status, page = 1, limit = 50 } = query;
    const cacheKey = `products:list:${businessId}:${search || 'all'}:${categoryId || 'all'}:${status || 'all'}:${page}:${limit}`;
    
    // Try cache first (cache list queries for 5 minutes)
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { businessId };
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

  async getProductById(id, businessId) {
    const cacheKey = `product:${businessId}:${id}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), businessId },
      include: { 
        category: { select: { id: true, name: true } },
        stocks: { 
          include: { warehouse: { select: { id: true, name: true } } }
        } 
      },
    });
    if (!product) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });
    
    // Cache for 10 minutes
    await cache.set(cacheKey, product, 600);
    return product;
  }

  async createProduct(data, userId, businessId, imageUrl = null) {
    const { 
      sku, name, categoryId, costPrice, sellPrice, wholesalePrice, stock, minStock, unit, barcode,
      packageName, packageQty, packageWeight, warehouseId
    } = data;

    const parsedSku = String(sku || '').trim();
    if (!parsedSku) throw Object.assign(new Error('SKU kiritilishi shart'), { statusCode: 400 });

    // Check duplicate SKU (SaaS scoped)
    const existing = await prisma.product.findFirst({ where: { sku: parsedSku, businessId } });
    if (existing) throw Object.assign(new Error(`Bu SKU (${parsedSku}) allaqachon mavjud`), { statusCode: 400 });

    const parsedBarcode = barcode && String(barcode).trim() ? String(barcode).trim() : null;

    if (parsedBarcode) {
      const barcodeExists = await prisma.product.findFirst({ where: { barcode: parsedBarcode, businessId } });
      if (barcodeExists) throw Object.assign(new Error(`Bu barcode (${parsedBarcode}) allaqachon mavjud`), { statusCode: 400 });
    }

    const parsedStock = parseFloat(stock);
    const finalStock = isNaN(parsedStock) ? 0 : parsedStock;

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: parsedSku,
          name: String(name),
          businessId,
          categoryId: parseInt(categoryId),
          costPrice: parseFloat(costPrice) || 0,
          sellPrice: parseFloat(sellPrice) || 0,
          wholesalePrice: parseFloat(wholesalePrice) || 0,
          stock: finalStock,
          minStock: parseFloat(minStock) || 5,
          unit: unit || 'ta',
          barcode: parsedBarcode,
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
        const defaultWarehouse = await tx.warehouse.findFirst({ where: { isActive: true, businessId }, orderBy: { id: 'asc' } });
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
              userId
            }
          });
        }
      }

      logAction({
        userId,
        businessId,
        action: 'CREATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        newData: { name: product.name, sku: product.sku, stock: product.stock }
      });

      // Invalidate cache
      await cache.invalidateEntity('products', businessId);

      return product;
    });
  }

  async updateProduct(id, data, userId, businessId, imageUrl = undefined) {
    const { sku, name, categoryId, costPrice, sellPrice, wholesalePrice, stock, minStock, unit, barcode,
            packageName, packageQty, packageWeight, isActive, warehouseId } = data;

    const oldProduct = await prisma.product.findFirst({ 
      where: { id: parseInt(id), businessId },
      include: { stocks: true }
    });
    if (!oldProduct) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });

    // Handle SKU update (SaaS scoped)
    if (sku && sku !== oldProduct.sku) {
      const existing = await prisma.product.findFirst({ where: { sku: String(sku), businessId, NOT: { id: parseInt(id) } } });
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
      ...(imageUrl && { image: imageUrl }),
    };

    // Explicitly delete image if requested (optional feature for future)
    if (data.deleteImage === 'true' || data.deleteImage === true) {
        updateData.image = null;
    }

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
          const defaultWarehouse = await tx.warehouse.findFirst({ where: { isActive: true, businessId }, orderBy: { id: 'asc' } });
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
        businessId,
        action: 'UPDATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        oldData: { name: oldProduct.name, sku: oldProduct.sku, stock: oldProduct.stock },
        newData: { name: product.name, sku: product.sku, stock: product.stock }
      });

      // Invalidate cache
      await cache.invalidateEntity('products', businessId);
      await cache.del(`product:${businessId}:${id}`);

      return product;
    });
  }

  async deleteProduct(id, userId, businessId) {
    const oldProduct = await prisma.product.findFirst({ where: { id: parseInt(id), businessId } });
    if (!oldProduct) throw Object.assign(new Error('Mahsulot topilmadi'), { statusCode: 404 });

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({ where: { id: parseInt(id) }, data: { isActive: false } });

      await tx.auditLog.create({
        data: {
          userId,
          businessId,
          action: 'DELETE_PRODUCT',
          entityType: 'Product',
          entityId: id,
          oldData: { isActive: true },
          newData: { isActive: false }
        }
      });

      // Invalidate cache
      await cache.invalidateEntity('products', businessId);
      await cache.del(`product:${businessId}:${id}`);

      return product;
    });
  }
}

module.exports = new ProductService();
