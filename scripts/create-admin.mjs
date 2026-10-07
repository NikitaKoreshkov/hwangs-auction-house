// Создаёт или обновляет администратора.
// Запуск: ADMIN_USERNAME=admin ADMIN_PASSWORD='длинный пароль' npm run db:admin
// Формат хранения — scrypt$соль$хеш, как его читает verifyPassword() в lib/admin.ts.
import crypto from 'crypto';
import pg from 'pg';

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error('Нужны ADMIN_USERNAME и ADMIN_PASSWORD');
  process.exit(1);
}
if (password.length < 12) {
  console.error('ADMIN_PASSWORD короче 12 символов');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    `INSERT INTO admin_users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [username, hash],
  );
  console.log(`администратор ${username} записан`);
} finally {
  await client.end();
}
