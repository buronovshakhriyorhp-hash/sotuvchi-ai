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
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; line-height: 1.4; margin: 0; padding: 0; }
                    .container { padding: 20px; }
                    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                    .brand { color: blue; font-size: 32px; font-weight: bold; }
                    .meta-info { text-align: right; }
                    .client-info { margin-bottom: 20px; }
                    .client-info b { color: #000; }
                    .status-line { color: red; font-weight: bold; text-align: center; margin-bottom: 10px; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    th { background-color: #f8f8f8; border: 1px solid #ddd; padding: 6px; font-weight: bold; text-align: center; }
                    td { border: 1px solid #ddd; padding: 6px; }
                    .totals-section { display: flex; flex-direction: column; align-items: flex-end; margin-top: 10px; }
                    .total-row { display: flex; width: 250px; justify-content: space-between; padding: 3px 0; }
                    .total-row b { min-width: 100px; text-align: left; }
                    .total-row span { text-align: right; flex-grow: 1; }
                    .final-total { border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; font-size: 13px; }
                    .footer-note { text-align: center; color: red; font-weight: bold; margin-top: 30px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header-top">
                        <div class="client-info">
                            <div><b>Клиент:</b> <span style="color: blue;">${sale.customer ? sale.customer.name : 'Общий клиент'}</span></div>
                            <div style="color: blue;">${sale.customer?.phone || ''}</div>
                            <div style="margin-top: 5px;"><b>Оформил:</b> ${sale.cashier?.name || 'Админ'}</div>
                            <div style="color: red;">${sale.cashier?.phone || ''}</div>
                            <div><b>Ответственный:</b> 4-B blok 8-magazin naves qator</div>
                        </div>
                        <div class="brand">BOOY</div>
                        <div class="meta-info">
                            <div><b>Статус:</b> Подтверждён</div>
                            <div><b>Номер:</b> ${sale.receiptNo}</div>
                            <div><b>Дата:</b> ${dateStr}</div>
                        </div>
                    </div>

                    <div class="status-line">Берилган товарни 3 кун муддатda tekshirib javobini ayting!</div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 3%;">№</th>
                                <th style="width: 30%;">Товар или услуга</th>
                                <th style="width: 8%;">Кол-во</th>
                                <th style="width: 8%;">Ед.Изм</th>
                                <th style="width: 10%;">Цена</th>
                                <th style="width: 8%;">Валюта</th>
                                <th style="width: 8%;">Скидка</th>
                                <th style="width: 10%;">Цена со скидкой</th>
                                <th style="width: 10%;">Сумма</th>
                                <th style="width: 10%;">Склад</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="totals-section">
                        ${showDebt ? `
                            <div class="total-row"><b>Долг до:</b> <span>${debtInfo.totalDebtBefore.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>
                        ` : ''}
                        
                        <div class="total-row ${showDebt ? '' : 'final-total'}"><b>Итого:</b> <span>${sale.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>
                        
                        ${showDebt ? `
                            <div class="total-row final-total" style="color: red;"><b>Итого долг:</b> <span>${debtInfo.totalDebtAfter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span></div>
                        ` : ''}
                    </div>

                    <div class="footer-note">Берилган товарни 3 кун муддатda tekshirib javobini ayting!</div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = new PdfService();
