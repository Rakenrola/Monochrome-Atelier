CREATE DATABASE IF NOT EXISTS sheesh_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE sheesh_inventory;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NULL,
  google_id VARCHAR(255) NULL,
  auth_provider ENUM('local', 'google', 'both') NOT NULL DEFAULT 'local',
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_unique (username),
  UNIQUE KEY users_email_unique (email),
  UNIQUE KEY users_google_id_unique (google_id)
) ENGINE=InnoDB;

ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

SET @google_id_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'google_id'
);
SET @google_id_column_sql = IF(
  @google_id_column_exists = 0,
  'ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER password',
  'SELECT 1'
);
PREPARE google_id_column_statement FROM @google_id_column_sql;
EXECUTE google_id_column_statement;
DEALLOCATE PREPARE google_id_column_statement;

SET @auth_provider_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'auth_provider'
);
SET @auth_provider_column_sql = IF(
  @auth_provider_column_exists = 0,
  'ALTER TABLE users ADD COLUMN auth_provider ENUM(''local'', ''google'', ''both'') NOT NULL DEFAULT ''local'' AFTER google_id',
  'SELECT 1'
);
PREPARE auth_provider_column_statement FROM @auth_provider_column_sql;
EXECUTE auth_provider_column_statement;
DEALLOCATE PREPARE auth_provider_column_statement;

SET @google_id_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_google_id_unique'
);
SET @google_id_index_sql = IF(
  @google_id_index_exists = 0,
  'ALTER TABLE users ADD UNIQUE KEY users_google_id_unique (google_id)',
  'SELECT 1'
);
PREPARE google_id_index_statement FROM @google_id_index_sql;
EXECUTE google_id_index_statement;
DEALLOCATE PREPARE google_id_index_statement;

UPDATE users
SET auth_provider = 'google'
WHERE password IS NULL AND auth_provider = 'local';

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY password_reset_token_hash_unique (token_hash),
  KEY password_reset_token_expiry_index (expires_at),
  CONSTRAINT password_reset_tokens_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  specs VARCHAR(500) NOT NULL,
  image VARCHAR(2048) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY products_category_index (category),
  CONSTRAINT products_price_nonnegative CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY carts_user_unique (user_id),
  CONSTRAINT carts_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY cart_items_cart_product_unique (cart_id, product_id),
  KEY cart_items_product_index (product_id),
  CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT cart_items_cart_fk
    FOREIGN KEY (cart_id) REFERENCES carts (id)
    ON DELETE CASCADE,
  CONSTRAINT cart_items_product_fk
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO products (id, title, category, price, specs, image)
VALUES
  (1, 'DARKCORE RTX 4090 OC EDITION', 'GPU', 1599.00, '24GB GDDR6X | Triple Fan Thermal System', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&q=80&w=800'),
  (2, 'NEBULA X870-A ATX MOTHERBOARD', 'MOTHERBOARD', 380.00, 'PCIe 5.0 | Wi-Fi 7 | Stealth PCB', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800'),
  (3, 'TITAN OLED 34" CURVED MONITOR', 'MONITOR', 990.00, '240Hz | 0.03ms GTG | UWQHD', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800'),
  (4, 'SHADOWBLADE HEAVY ALUMINUM KEYBOARD', 'PERIPHERALS', 185.00, 'CNC Anodized | Custom Magnetic Switches', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=800'),
  (5, 'SPECTRE 64GB DDR5 7200MHz RAM', 'MEMORY', 240.00, '2x32GB | Low Latency Matte Heatsink', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=800'),
  (6, 'OBSIDIAN ZERO-AIRFLOW MID TOWER', 'CASES', 210.00, 'Dual Tempered Glass | Hidden Cable Routing', 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&q=80&w=800'),
  (7, 'METEOR 3 MID TOWER', 'CASES', 110.00, 'Tempered Glass | Hidden Cable Routing', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRswljnh9wlOgt54ALtXpnv30PpC5kMH9Xgk9NLjmd6Tw&s=100');
