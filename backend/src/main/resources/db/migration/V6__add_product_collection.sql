ALTER TABLE products
    ADD COLUMN collection_id BIGINT NULL,
    ADD CONSTRAINT fk_products_collection
        FOREIGN KEY (collection_id) REFERENCES collections(id)
        ON DELETE SET NULL,
    ADD INDEX idx_products_collection (collection_id);