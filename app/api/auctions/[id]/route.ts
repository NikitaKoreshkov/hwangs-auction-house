import { NextRequest, NextResponse } from 'next/server';
import pool, { hasDatabase } from '@/lib/db';
import { demoAuction } from '@/lib/demo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auctionId = parseInt(id, 10);

    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: 'Неверный ID аукциона' },
        { status: 400 }
      );
    }

    if (!hasDatabase) {
      const demo = demoAuction(auctionId);
      return demo
        ? NextResponse.json(demo)
        : NextResponse.json({ error: 'Аукцион не найден' }, { status: 404 });
    }

    // Получаем аукцион по ID
    const result = await pool.query(
      'SELECT * FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Аукцион не найден' },
        { status: 404 }
      );
    }

    // Получаем похожие аукционы из той же категории (если есть)
    const auction = result.rows[0];
    let relatedAuctions: any[] = [];
    
    if (auction.category) {
      const relatedResult = await pool.query(
        'SELECT * FROM auctions WHERE category = $1 AND id != $2 ORDER BY id ASC LIMIT 16',
        [auction.category, auctionId]
      );
      relatedAuctions = relatedResult.rows;
    }

    return NextResponse.json({ 
      auction: auction,
      relatedAuctions: relatedAuctions
    }, { status: 200 });
  } catch (error: any) {
    console.error('Ошибка при получении аукциона:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при получении аукциона' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auctionId = parseInt(id, 10);

    if (isNaN(auctionId)) {
      return NextResponse.json(
        { error: 'Неверный ID аукциона' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Необходимо предоставить массив изображений' },
        { status: 400 }
      );
    }

    // Обновляем изображения аукциона
    const result = await pool.query(
      'UPDATE auctions SET images = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [images, auctionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Аукцион не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      auction: result.rows[0],
      message: 'Изображения успешно обновлены'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Ошибка при обновлении аукциона:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обновлении аукциона' },
      { status: 500 }
    );
  }
}
