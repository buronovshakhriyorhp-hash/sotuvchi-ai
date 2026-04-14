const puppeteer = require('puppeteer');

class PdfService {
    async generateSaleReceipt(sale, items, debtInfo = null) {
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            const html = this.getSaleReceiptTemplate(sale, items, debtInfo);
            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
            });

            return pdfBuffer;
        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    getSaleReceiptTemplate(sale, items, debtInfo) {
        const dateStr = new Date(sale.createdAt).toLocaleString('ru-RU', { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(',', '');
        
        const itemsHtml = items.map((item, index) => {
            const discount = sale.discount || 0;
            const priceWithDiscount = item.unitPrice * (1 - (sale.discountType === 'percent' ? discount / 100 : 0));
            return `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${item.product.name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: center;">${item.product.unit || 'Штук'}</td>
                    <td style="text-align: right;">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: center;">USD</td>
                    <td style="text-align: center;">${discount}${sale.discountType === 'percent' ? '%' : ''}</td>
                    <td style="text-align: right;">${priceWithDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: right;">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: center;">${sale.warehouseName || 'Главный склад'}</td>
                </tr>
            `;
        }).join('');

        const showDebt = debtInfo && debtInfo.totalDebtAfter > 0;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Arial', sans-serif; font-size: 10px; color: #333; line-height: 1.3; margin: 0; padding: 0; background: #fff; }
                    .container { padding: 30px; }
                    .header-section { display: flex; justify-content: space-between; position: relative; margin-bottom: 30px; }
                    .brand-title { 
                        position: absolute; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        font-size: 36px; 
                        font-weight: 800; 
                        color: #1a365d; 
                        top: 0;
                    }
                    .left-meta { width: 35%; }
                    .right-meta { width: 35%; text-align: right; }
                    .info-row { margin-bottom: 4px; }
                    .info-row b { color: #000; width: 85px; display: inline-block; }
                    .val-blue { color: #2b6cb0; }
                    .val-red { color: #c53030; }
                    
                    .status-banner { 
                        color: #c53030; 
                        font-weight: 800; 
                        text-align: center; 
                        font-size: 13px; 
                        margin: 15px 0; 
                        text-transform: uppercase;
                    }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                    th { background-color: #f7fafc; border: 0.5px solid #a0aec0; padding: 5px; font-weight: bold; font-size: 9px; }
                    td { border: 0.5px solid #a0aec0; padding: 5px; }

                    .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 15px; }
                    .totals-table { width: 300px; }
                    .totals-table div { display: flex; justify-content: space-between; padding: 3px 0; }
                    .totals-table .border-top { border-top: 1.5px solid #000; margin-top: 5px; padding-top: 5px; }
                    .totals-table b { font-size: 11px; }

                    .footer-warning { 
                        margin-top: 40px; 
                        text-align: center; 
                        color: #c53030; 
                        font-weight: bold; 
                        font-size: 11px;
                        border-top: 0.5px dashed #a0aec0;
                        padding-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header-section">
                        <div class="left-meta">
                            <div class="info-row"><b>Клиент:</b> <span class="val-blue">${sale.customer ? sale.customer.name : 'Чаккана мижоз'}</span></div>
                            <div class="info-row"><b style="visibility:hidden">Тел:</b> <span class="val-blue">${sale.customer?.phone || ''}</span></div>
                            <div class="info-row" style="margin-top: 8px;"><b>Оформил:</b> <span>${sale.cashier?.name || 'Админ'}</span></div>
                            <div class="info-row"><b style="visibility:hidden">Тел:</b> <span class="val-red">${sale.cashier?.phone || ''}</span></div>
                            <div class="info-row"><b>Ответственный:</b> <span>Nexus ERP System</span></div>
                        </div>
                        
                        <div class="brand-title">${sale.customer?.business?.settings?.storeName || 'MIJOZ'}</div>
                        
                        <div class="right-meta">
                            <div class="info-row"><b>Статус:</b> <span>Подтверждён</span></div>
                            <div class="info-row"><b>Номер:</b> <span>${sale.receiptNo}</span></div>
                            <div class="info-row"><b>Дата:</b> <span>${dateStr}</span></div>
                        </div>
                    </div>

                    <div class="status-banner">Mahsulotni qabul qilib olgan vaqtingizda tekshirib oling!</div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 3%;">№</th>
                                <th style="width: 32%;">Товар или услуга</th>
                                <th style="width: 7%;">Кол-во</th>
                                <th style="width: 7%;">Ед.Изм</th>
                                <th style="width: 10%;">Цена</th>
                                <th style="width: 7%;">Валюта</th>
                                <th style="width: 7%;">Скидка</th>
                                <th style="width: 10%;">С цена</th>
                                <th style="width: 10%;">Сумма</th>
                                <th style="width: 10%;">Склад</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="totals-wrapper">
                        <div class="totals-table">
                            ${showDebt ? `
                                <div><b>Долг до:</b> <span>${debtInfo.totalDebtBefore.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>
                                <div><b>Долг до:</b> <span>0 UZS</span></div>
                            ` : ''}
                            
                            <div class="${showDebt ? '' : 'border-top'}"><b>Jami:</b> <span>${sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>
                            
                            ${showDebt ? `
                                <div class="border-top"><b class="val-red">Jami qarz:</b> <span class="val-red">${debtInfo.totalDebtAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="footer-warning">Xaridingiz uchun rahmat!</div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new PdfService();
