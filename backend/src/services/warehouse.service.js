const prisma = require('../prisma');

class WarehouseService {
  async getAllWarehouses(businessId) {
    return await prisma.warehouse.findMany({
      where: { businessId },
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { stocks: true } }
      }
    });
  }

  async getWarehouseById(id, businessId) {
    return await prisma.warehouse.findFirst({
      where: { id: parseInt(id), businessId },
      include: {
        stocks: {
          include: {
            product: { select: { id: true, name: true, sku: true } }
          }
        }
      }
    });
  }

  async createWarehouse(data, businessId) {
    // SEC-05: Mass Assignment himoyasi — faqat ruxsat etilgan maydonlar
    const { name, address } = data || {};
    if (!name) throw Object.assign(new Error('Ombor nomi kiritilishi shart'), { statusCode: 400 });
    return await prisma.warehouse.create({ data: { name, address, businessId } });
  }

  async updateWarehouse(id, data, businessId) {
    // SEC-05: Mass Assignment himoyasi — faqat ruxsat etilgan maydonlar
    const { name, address, isActive } = data || {};
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await prisma.warehouse.updateMany({
      where: { id: parseInt(id), businessId },
      data: updateData
    });
    if (result.count === 0) throw Object.assign(new Error('Ombor topilmadi'), { statusCode: 404 });
    return await prisma.warehouse.findUnique({ where: { id: parseInt(id) } });
  }

  async deleteWarehouse(id, businessId) {
    const wId = parseInt(id);
    const stockCount = await prisma.productStock.count({ 
      where: { warehouseId: wId, quantity: { gt: 0 }, warehouse: { businessId } } 
    });
    if (stockCount > 0) {
      throw Object.assign(new Error('Omborda mahsulotlar borligi sababli o\'chirishning imkoni yo\'q'), { statusCode: 400 });
    }
    const result = await prisma.warehouse.deleteMany({ where: { id: wId, businessId } });
    if (result.count === 0) throw Object.assign(new Error('Ombor topilmadi'), { statusCode: 404 });
    return true;
  }
}

module.exports = new WarehouseService();
