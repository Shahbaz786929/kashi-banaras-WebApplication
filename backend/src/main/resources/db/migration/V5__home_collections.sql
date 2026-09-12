CREATE TABLE home_collections (
    id BIGINT NOT NULL AUTO_INCREMENT,

    name VARCHAR(200) NOT NULL,

    slug VARCHAR(220) NOT NULL UNIQUE,

    description TEXT,

    image_url VARCHAR(500) NOT NULL,

    button_text VARCHAR(100),

    button_link VARCHAR(500),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL,

    updated_at DATETIME NOT NULL,

    PRIMARY KEY (id),

    INDEX idx_home_collections_active_sort (is_active, sort_order)
);