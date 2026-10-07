import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

// GET - получить все заявки (автоматически удаляет старше 24 часов)
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    // Удаляем записи старше 24 часов
    await pool.query(`
      DELETE FROM contact_requests 
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `);

    // Получаем актуальные заявки
    const result = await pool.query(`
      SELECT cr.*, a.name as auction_name
      FROM contact_requests cr
      LEFT JOIN auctions a ON cr.auction_id = a.id
      ORDER BY cr.created_at DESC
    `);

    return NextResponse.json({ requests: result.rows });
  } catch (error) {
    console.error('Ошибка получения заявок:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить заявку вручную
export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID заявки обязателен' }, { status: 400 });
    }

    await pool.query('DELETE FROM contact_requests WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления заявки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

