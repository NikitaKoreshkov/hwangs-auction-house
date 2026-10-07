import { NextResponse } from 'next/server';
import pool, { hasDatabase } from '@/lib/db';

// POST - создать новую заявку обратной связи
export async function POST(request: Request) {
  try {
    const { name, email, phone, message, auction_id } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Имя, email и сообщение обязательны' },
        { status: 400 }
      );
    }

    if (!hasDatabase) {
      return NextResponse.json({
        success: true,
        message: 'Форма принята: без базы данных заявка не сохраняется',
        demo: true,
      });
    }

    const result = await pool.query(
      `INSERT INTO contact_requests (name, email, phone, message, auction_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone || null, message, auction_id || null]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Заявка отправлена успешно',
      request: result.rows[0] 
    });
  } catch (error) {
    console.error('Ошибка создания заявки:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

