import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const hasDatabase = Boolean(connectionString);

const pool = new Pool(
  connectionString
    ? { connectionString }
    : // Без DATABASE_URL запросы к pg не доходят: публичные роуты отдают демо-набор
      // из lib/demo.ts (см. isDemo в app/api/*). Пул остаётся нерабочим намеренно.
      { connectionString: 'postgresql://localhost:5432/unused' },
);

export default pool;
