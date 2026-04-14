const prisma = require('../prisma');
const superAdminBot = require('./superadmin.bot.service');

class CronService {
    constructor() {
        // Set up the interval for 48 hours (48 * 60 * 60 * 1000 ms)
        this.intervalTime = 48 * 60 * 60 * 1000; 
        this.init();
    }

    init() {
        console.log('⏰ SaaS Davriy eslatma tizimi (Cron) ishga tushdi.');
        
        // Immediate check on startup (optional)
        // this.checkPendingBusinesses();

        setInterval(() => {
            this.checkPendingBusinesses();
        }, this.intervalTime);
    }

    async checkPendingBusinesses() {
        try {
            const pendingCount = await prisma.business.count({
                where: { isApproved: false }
            });

            if (pendingCount > 0) {
                const msg = `📢 <b>Davriy Eslatma:</b>\n\nHozirda <b>${pendingCount}</b> ta biznes tasdiqlanishini kutmoqda. \nUlarni ko'rish uchun /pending buyrug'ini bosing.`;
                await superAdminBot.bot.api.sendMessage(superAdminBot.rootId, msg, { parse_mode: 'HTML' });
                console.log(`[Cron] Sent pending reminder for ${pendingCount} businesses.`);
            }
        } catch (err) {
            console.error('[Cron] Error checking pending businesses:', err.message);
        }
    }
}

module.exports = new CronService();
