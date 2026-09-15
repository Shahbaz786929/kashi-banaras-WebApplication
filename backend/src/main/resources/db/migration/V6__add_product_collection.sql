-- Add collection_id column first
ALTER TABLE products
    ADD COLUMN collection_id BIGINT NULL;

-- Add index after column exists
ALTER TABLE products
    ADD INDEX idx_products_collection (collection_id);

-- Add foreign key after column and index exist
ALTER TABLE products
    ADD CONSTRAINT fk_products_collection
        FOREIGN KEY (collection_id)
        REFERENCES collections(id)
        ON DELETE SET NULL;
