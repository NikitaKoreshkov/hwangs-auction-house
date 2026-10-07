import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createSessionToken, sessionCookieOptions, verifyPassword, SESSION_COOKIE_NAME } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
    }

    const result = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);

    // Сравнение только по хешу scrypt: время ответа не зависит от того, найден ли
    // логин, поэтому список существующих логинов не вытащить перебором
    if (result.rows.length === 0 || !verifyPassword(password, result.rows[0].password_hash)) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(username), sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
