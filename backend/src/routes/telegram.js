const QRCode = require('qrcode');
const botService = require('../services/bot.service');
const { sendSuccess, sendError } = require('../services/response.utility');

async function telegramRoutes(fastify, options) {
    // Get bot link and QR code
    fastify.get('/info', async (request, reply) => {
        const username = botService.username || 'bot_yuklanmoqda';
        const link = `https://t.me/${username}`;
        
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(link, {
                margin: 2,
                width: 300,
                color: {
                    dark: '#0088cc', // Telegram blue
                    light: '#ffffff'
                }
            });
            
            return sendSuccess(reply, {
                username,
                link,
                qrCode: qrCodeDataUrl
            });
        } catch (err) {
            return sendError(reply, err.message, 500);
        }
    });

    // Test PDF generation and sending for a sale
    fastify.post('/send-test-pdf', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { saleId } = request.body;
        if (!saleId) return reply.status(400).send({ success: false, error: 'saleId majburiy' });
        
        try {
            await botService.sendSaleNotification(parseInt(saleId));
            return { success: true, message: 'PDF muvaffaqiyatli yuborildi' };
        } catch (err) {
            return reply.status(500).send({ success: false, error: err.message });
        }
    });
}

module.exports = telegramRoutes;
