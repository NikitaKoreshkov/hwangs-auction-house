-- Схема аукционного дома Hwang's.
-- Порядок важен: таблицы, на которые ссылаются внешние ключи, создаются первыми.
-- Раньше схема жила в lib/db.ts как 28 запросов initDatabase(), которые вызывались
-- из обработчиков API, и на чистой базе падали на восьмом: ALTER TABLE auctions
-- ADD COLUMN category_id ... REFERENCES auction_categories(id) шёл раньше CREATE
-- TABLE auction_categories.

BEGIN;

CREATE TABLE IF NOT EXISTS auction_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auction_subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES auction_categories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS filters (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES auction_categories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'checkbox' | 'range' | 'text'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS filter_options (
  id SERIAL PRIMARY KEY,
  filter_id INTEGER REFERENCES filters(id) ON DELETE CASCADE,
  value VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auctions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  additional_info VARCHAR(500),
  starting_price VARCHAR(100) NOT NULL,
  auction_dates VARCHAR(50),
  images TEXT[] DEFAULT '{}',
  category VARCHAR(100),          -- свободная строка до появления category_id
  subcategory VARCHAR(100),       -- то же, заменена subcategory_ids
  category_id INTEGER REFERENCES auction_categories(id) ON DELETE SET NULL,
  subcategory_ids INTEGER[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,           -- один сертификат до появления certificates
  certificates JSONB DEFAULT '[]', -- [{url, type: 'image' | 'pdf'}]
  detail_sections JSONB DEFAULT '[]', -- [{title, content}]
  filter_values JSONB DEFAULT '{}',   -- {filter_id: value}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size VARCHAR(50),
  file_type VARCHAR(10) DEFAULT 'PDF',
  document_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(document_date DESC);

CREATE TABLE IF NOT EXISTS homepage_content (
  id SERIAL PRIMARY KEY,
  section VARCHAR(100) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS about_content (
  id SERIAL PRIMARY KEY,
  section VARCHAR(100) NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  auction_id INTEGER REFERENCES auctions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_created ON contact_requests(created_at DESC);

-- Пароль хранится хешем scrypt (lib/admin.ts), в дампе его нет.
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
