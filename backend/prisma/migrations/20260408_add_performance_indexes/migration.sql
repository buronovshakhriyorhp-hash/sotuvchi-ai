
-- Performance Optimization: Add Composite Indexes
-- This migration adds indexes for frequently queried patterns

-- Product Queries
CREATE INDEX "idx_product_active_category" ON "Product"("isActive", "categoryId");
CREATE INDEX "idx_product_active_stock" ON "Product"("isActive", "stock");

-- Sales Queries  
CREATE INDEX "idx_sale_status_created" ON "Sale"("status", "createdAt");
CREATE INDEX "idx_sale_payment_created" ON "Sale"("paymentMethod", "createdAt");

-- Debt Queries
CREATE INDEX "idx_debt_type_status" ON "Debt"("type", "status");
CREATE INDEX "idx_debt_status_due" ON "Debt"("status", "dueDate");

-- Expense Queries
CREATE INDEX "idx_expense_category_date" ON "Expense"("category", "date");
CREATE INDEX "idx_expense_user_idx" ON "Expense"("userId");
