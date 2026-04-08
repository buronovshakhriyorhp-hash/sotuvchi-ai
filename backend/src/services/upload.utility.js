const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Fastify request.parts() dan rasm va fieldlarni ajratib oladi
 * @param {Object} request - Fastify request object
 * @param {String} subDir - 'products', 'staff', 'customers', etc.
 * @returns {Promise<{fields: Object, imageUrl: String}>}
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
      fileExt = path.extname(originalName) || '.jpg';
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  let imageUrl = null;
  if (fileBuffer && fileBuffer.length > 0) {
    const uploadsDir = path.join(__dirname, '../../uploads', subDir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const uniqueName = crypto.randomBytes(16).toString('hex') + fileExt;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);
    imageUrl = `/uploads/${subDir}/${uniqueName}`;
  }

  return { fields, imageUrl };
}

module.exports = { processMultipart };
