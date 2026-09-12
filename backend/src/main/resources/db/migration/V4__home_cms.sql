CREATE TABLE home_banners (
    id BIGINT NOT NULL AUTO_INCREMENT,
    small_heading VARCHAR(200),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    button_text VARCHAR(100),
    button_link VARCHAR(500),
    image_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE collections (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    button_text VARCHAR(100) DEFAULT 'SHOP NOW',
    button_link VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id)
);