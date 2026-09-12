-- Repair live product catalog data so the public storefront and admin flows
-- can resolve products and collection pages correctly.

UPDATE products
SET collection_id = 2
WHERE id IN (1, 2, 3, 4, 5, 6);

UPDATE products
SET collection_id = 3
WHERE id IN (7, 9);

UPDATE products
SET slug = 'murakapuri-katan-silk'
WHERE id = 9;

UPDATE products
SET slug = 'solder'
WHERE id = 7;
