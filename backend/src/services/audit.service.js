const prisma = require('../prisma');

/**
 * Tizimdagi har qanday o'zgarishni (Audit) asinxron tarzda saqlash.
 * Bu POS yoki boshqa jarayonlar tezligiga ta'sir qilmaydi.
 */
async function logAction({ userId, businessId, action, entityType, entityId, oldData, newData, note }) {
  try {
    // Asinxron bajarish (await qilmaslik tezlikni oshiradi, lekin biz xatoliklarni kuzatishimiz kerak)
    prisma.auditLog.create({
      data: {
        userId,
        businessId,
        action,
        entityType,
        entityId: entityId ? parseInt(entityId) : null,
        oldData: oldData || null,
        newData: newData || null,
      }
    }).catch(err => {
      console.error('Audit Log Error:', err);
    });
  } catch (err) {
    console.error('Audit Log Sync Error:', err);
  }
}

module.exports = {
  logAction
};
