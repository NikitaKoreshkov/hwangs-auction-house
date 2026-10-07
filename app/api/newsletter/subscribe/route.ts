import { NextRequest, NextResponse } from 'next/server';
import pool, { hasDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Валидация email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Простая валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // В демо-режиме валидация проходит, но адрес никуда не пишется
    if (!hasDatabase) {
      return NextResponse.json({
        success: true,
        message: 'Форма принята: без базы данных адрес не сохраняется',
        demo: true,
      });
    }

    // Проверка, существует ли уже такой email
    const checkResult = await pool.query(
      'SELECT id FROM newsletter_subscriptions WHERE email = $1',
      [normalizedEmail]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { 
          message: 'Вы уже подписаны на нашу рассылку',
          alreadySubscribed: true 
        },
        { status: 200 }
      );
    }

    // Создание новой подписки
    await pool.query(
      'INSERT INTO newsletter_subscriptions (email) VALUES ($1)',
      [normalizedEmail]
    );

    return NextResponse.json(
      { 
        message: 'Вы успешно подписались на нашу рассылку!',
        alreadySubscribed: false 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Ошибка при подписке:', error);
    
    // Обработка ошибки уникальности (на случай, если email уже существует)
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          message: 'Вы уже подписаны на нашу рассылку',
          alreadySubscribed: true 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Произошла ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}

