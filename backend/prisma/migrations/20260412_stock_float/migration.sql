-- Migration: stock va minStock ustunlarini Int'dan Float ga o'zgartirish
-- Sabab: Og'irlik (kg, g), hajm (litr, ml) kabi kasr miqdorlar uchun Float zarur

-- Product.stock: Int -> Float  
ALTER TABLE "Product" ALTER COLUMN "stock" TYPE DOUBLE PRECISION;

-- Product.minStock: Int -> Float
ALTER TABLE "Product" ALTER COLUMN "minStock" TYPE DOUBLE PRECISION;
