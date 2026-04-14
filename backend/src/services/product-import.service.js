const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const xlsx = require('xlsx');
const AdmZip = require('adm-zip');
const prisma = require('../prisma');
const cache = require('../utils/cache');

class ProductImportService {
  /**
   * Main entry point for bulk product import
   */
  async importProducts({ excelBuffer, zipBuffer, userId, businessId, targetWarehouseId }) {
    // 1. Parse Excel
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data.length) throw new Error('Excel fayli bo\'sh');

    // 2. Prepare for images if ZIP exists
    let imageMap = {};
    if (zipBuffer) {
      imageMap = await this._processZipImages(zipBuffer);
    }

    const results = {
      total: data.length,
      imported: 0,
      errors: []
    };

    // 3. Process each row
    // Using for loop to handle sequential category creation and matching
    for (let i = 0; i < data.length; i++) {
        try {
            const row = data[i];
            await this._processRow(row, imageMap, userId, businessId, targetWarehouseId);
            results.imported++;
        } catch (err) {
            results.errors.push({ row: i + 2, error: err.message, data: data[i] });
        }
    }

    // 4. Invalidate cache
    await cache.invalidateEntity('products', businessId);

    return results;
  }

  async _processRow(row, imageMap, userId, businessId, targetWarehouseId) {
    const { 
      Name, SKU, Category, CostPrice, SellPrice, WholesalePrice, Stock, Unit, Barcode 
    } = this._normalizeRow(row);

    if (!Name || !SKU) throw new Error('Nomi va SKU bo\'lishi shart');

    // 1. Handle Category
    let categoryId;
    if (Category) {
      const cat = await prisma.category.upsert({
        where: { name_businessId: { name: Category, businessId } },
        update: {},
        create: { name: Category, businessId }
      });
      categoryId = cat.id;
    } else {
        // Find or create "Boshqa" (Uncategorized)
        const cat = await prisma.category.upsert({
            where: { name_businessId: { name: 'Boshqa', businessId } },
            update: {},
            create: { name: 'Boshqa', businessId }
          });
          categoryId = cat.id;
    }

    // 2. Map Image
    let imageUrl = imageMap[SKU] || imageMap[Barcode] || null;

    // 3. Create Product & Stock in Transaction
    await prisma.$transaction(async (tx) => {
      // Check duplicate
      const existing = await tx.product.findFirst({
        where: { OR: [{ sku: SKU }, { barcode: Barcode ? Barcode : undefined }], businessId }
      });
      if (existing) throw new Error(`SKU yoki Barcode (${SKU}) allaqachon mavjud`);

      const product = await tx.product.create({
        data: {
          name: String(Name),
          sku: String(SKU),
          categoryId,
          businessId,
          costPrice: parseFloat(CostPrice) || 0,
          sellPrice: parseFloat(SellPrice) || 0,
          wholesalePrice: parseFloat(WholesalePrice) || 0,
          stock: parseFloat(Stock) || 0,
          unit: Unit || 'ta',
          barcode: Barcode ? String(Barcode) : null,
          image: imageUrl,
          isActive: true
        }
      });

      // Stock record
      if (targetWarehouseId && Stock > 0) {
        await tx.productStock.create({
          data: {
            productId: product.id,
            warehouseId: parseInt(targetWarehouseId),
            quantity: parseFloat(Stock)
          }
        });

        await tx.warehouseTx.create({
          data: {
            type: 'IN',
            productId: product.id,
            warehouseId: parseInt(targetWarehouseId),
            quantity: parseFloat(Stock),
            userId,
            businessId
          }
        });
      }
    });
  }

  _normalizeRow(row) {
    // Basic mapping for common Excel headers (UZ/RU/EN)
    return {
      Name: row.Name || row['Nomi'] || row['Наименование'] || row.name,
      SKU: String(row.SKU || row['Artikul'] || row['Артикул'] || row.sku || '').trim(),
      Category: row.Category || row['Turkum'] || row['Kategoriya'] || row['Категория'],
      CostPrice: row.CostPrice || row['Tan narxi'] || row['Sebestoyimost'] || row['Цена закупки'],
      SellPrice: row.SellPrice || row['Sotish narxi'] || row['Sena'] || row['Цена'],
      WholesalePrice: row.WholesalePrice || row['Ulgurji narx'] || row['Optom sena'],
      Stock: row.Stock || row['Qoldiq'] || row['Ostatok'] || row['Soni'],
      Unit: row.Unit || row['Birlik'] || row['Edinisa'],
      Barcode: String(row.Barcode || row['Shtrix-kod'] || row['Shtrixkod'] || row['Штрихкод'] || '').trim() || null
    };
  }

  async _processZipImages(zipBuffer) {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    const map = {};
    const uploadsDir = path.join(__dirname, '../../uploads/products');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const fileName = entry.name; // e.g., apple-123.jpg
      const sku = path.parse(fileName).name; // e.g., apple-123
      
      const uniqueName = crypto.randomBytes(16).toString('hex') + path.extname(fileName);
      const filePath = path.join(uploadsDir, uniqueName);
      
      fs.writeFileSync(filePath, entry.getData());
      map[sku] = `/uploads/products/${uniqueName}`;
    }

    return map;
  }
}

module.exports = new ProductImportService();
