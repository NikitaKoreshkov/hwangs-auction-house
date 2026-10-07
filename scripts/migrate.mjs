// Применяет db/schema.sql к базе из DATABASE_URL.
// Запуск: npm run db:migrate
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Нужен DATABASE_URL (см. .env.example)');
  process.exit(1);
}

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'db', 'schema.sql');
const client = new pg.Client({ connectionString: url });

await client.connect();
try {
  await client.query(readFileSync(schemaPath, 'utf8'));
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log(`схема применена, таблиц в public: ${tables.rows.length}`);
  console.log(tables.rows.map((row) => row.table_name).join(', '));
} finally {
  await client.end();
}
