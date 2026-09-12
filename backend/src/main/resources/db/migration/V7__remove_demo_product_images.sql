DELETE FROM product_images
WHERE LOWER(url) LIKE '%images.unsplash.com%'
   OR LOWER(url) LIKE '%unsplash.com%';

DELETE FROM home_banners
WHERE LOWER(image_url) LIKE '%images.unsplash.com%'
   OR LOWER(image_url) LIKE '%unsplash.com%';

DELETE FROM collections
WHERE LOWER(image_url) LIKE '%images.unsplash.com%'
   OR LOWER(image_url) LIKE '%unsplash.com%';

DELETE FROM categories
WHERE LOWER(image_url) LIKE '%images.unsplash.com%'
   OR LOWER(image_url) LIKE '%unsplash.com%';