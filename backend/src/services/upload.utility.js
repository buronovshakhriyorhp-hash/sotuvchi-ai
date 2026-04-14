const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// SEC-06: Faqat ruxsat etilgan rasm formatlari
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — rasm uchun yetarli

// Magic bytes — haqiqiy rasm ekanligini tasdiqlash (extension spoof'dan himoya)
const MAGIC_BYTES = {
  'ffd8ff':   'jpg',   // JPEG
  '89504e47': 'png',   // PNG
  '47494638': 'gif',   // GIF
  '52494646': 'webp',  // RIFF (WebP container)
  '3c3f786d': 'svg',   // <?xml (SVG)
  '3c737667': 'svg',   // <svg
};

function detectFileType(buffer) {
  if (!buffer || buffer.length < 4) return null;
  const hex = buffer.subarray(0, 4).toString('hex').toLowerCase();
  for (const [magic, type] of Object.entries(MAGIC_BYTES)) {
    if (hex.startsWith(magic)) return type;
  }
  return null;
}

/**
 * Fastify request.parts() dan rasm va fieldlarni ajratib oladi.
 * SEC-06: Extension whitelist + Magic Byte validation qo'shilgan.
 *
 * @param {Object} request - Fastify request object
 * @param {String} subDir - 'products', 'staff', 'customers', etc.
 * @returns {Promise<{fields: Object, imageUrl: String|null}>}
 */
async function processMultipart(request, subDir = 'general') {
  const parts = request.parts();
  const fields = {};
  let fileBuffer = null;
  let fileExt = '.jpg';

  for await (const part of parts) {
    if (part.type === 'file') {
      const chunks = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
      const originalName = part.filename || 'image.jpg';
      fileExt = path.extname(originalName).toLowerCase() || '.jpg';

      // ── SEC-06 CHECK 1: Extension whitelist ──
      if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
        throw Object.assign(
          new Error(`Ruxsat etilmagan fayl turi: ${fileExt}. Faqat rasmlar: ${ALLOWED_EXTENSIONS.join(', ')}`),
          { statusCode: 400 }
        );
      }

      // ── SEC-06 CHECK 2: Fayl hajmi ──
      if (fileBuffer.length > MAX_FILE_SIZE) {
        throw Object.assign(
          new Error(`Fayl hajmi ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB — max 5MB ruxsat etiladi`),
          { statusCode: 400 }
        );
      }

      // ── SEC-06 CHECK 3: Magic bytes — haqiqiy rasm tekshiruvi ──
      // (Tajovuzkor .jpg extension bilan .exe yuklashini bloklaydi)
      if (fileExt !== '.svg') { // SVG text-based, magic bytes har xil bo'lishi mumkin
        const detectedType = detectFileType(fileBuffer);
        if (!detectedType) {
          throw Object.assign(
            new Error('Fayl tarkibi rasm formatiga mos kelmadi. Haqiqiy rasm yuklang.'),
            { statusCode: 400 }
          );
        }
      }
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  let imageUrl = null;
  if (fileBuffer && fileBuffer.length > 0) {
    // Path traversal himoyasi: subDir dan ../ olib tashlash
    const safeSubDir = subDir.replace(/\.\./g, '').replace(/[\/\\]/g, '_');
    const uploadsDir = path.join(__dirname, '../../uploads', safeSubDir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Fayl nomi: random hex + ruxsat etilgan extension
    const uniqueName = crypto.randomBytes(16).toString('hex') + fileExt;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);
    imageUrl = `/uploads/${safeSubDir}/${uniqueName}`;
  }

  return { fields, imageUrl };
}

module.exports = { processMultipart };
