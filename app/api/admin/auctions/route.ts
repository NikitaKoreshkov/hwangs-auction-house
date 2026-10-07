import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

// GET - получить все аукционы (для админки)
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const result = await pool.query(`
      SELECT a.*, ac.name as category_name
      FROM auctions a
      LEFT JOIN auction_categories ac ON a.category_id = ac.id
      ORDER BY a.created_at DESC
    `);

    return NextResponse.json({ auctions: result.rows });
  } catch (error) {
    console.error('Ошибка получения аукционов:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - добавить новый аукцион
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const {
      name,
      additional_info,
      starting_price,
      auction_dates,
      images,
      category_id,
      subcategory_ids,
      is_featured,
      certificate_url,
      certificates,
      detail_sections,
      filter_values,
    } = await request.json();

    if (!name || !starting_price) {
      return NextResponse.json(
        { error: 'Название и начальная цена обязательны' },
        { status: 400 }
      );
    }

    // Проверяем количество featured аукционов
    if (is_featured) {
      const featuredCount = await pool.query(
        'SELECT COUNT(*) FROM auctions WHERE is_featured = true'
      );
      
      if (parseInt(featuredCount.rows[0].count) >= 4) {
        return NextResponse.json(
          { error: 'Максимум 4 аукциона могут быть на главной' },
          { status: 400 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO auctions (
        name, additional_info, starting_price, auction_dates, images,
        category_id, subcategory_ids, is_featured, certificate_url, certificates, detail_sections, filter_values
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        additional_info || null,
        starting_price,
        auction_dates || null,
        images || [],
        category_id || null,
        subcategory_ids || [],
        is_featured || false,
        certificate_url || null,
        JSON.stringify(certificates || []),
        JSON.stringify(detail_sections || []),
        JSON.stringify(filter_values || {}),
      ]
    );

    return NextResponse.json({ success: true, auction: result.rows[0] });
  } catch (error) {
    console.error('Ошибка добавления аукциона:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT - обновить аукцион
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const {
      id,
      name,
      additional_info,
      starting_price,
      auction_dates,
      images,
      category_id,
      subcategory_ids,
      is_featured,
      certificate_url,
      certificates,
      detail_sections,
      filter_values,
    } = await request.json();


    if (!id || !name || !starting_price) {
      return NextResponse.json(
        { error: 'ID, название и начальная цена обязательны' },
        { status: 400 }
      );
    }

    // Проверяем количество featured аукционов (если меняем на featured)
    if (is_featured) {
      const currentAuction = await pool.query(
        'SELECT is_featured FROM auctions WHERE id = $1',
        [id]
      );
      
      // Если аукцион не был featured раньше
      if (!currentAuction.rows[0]?.is_featured) {
        const featuredCount = await pool.query(
          'SELECT COUNT(*) FROM auctions WHERE is_featured = true'
        );
        
        if (parseInt(featuredCount.rows[0].count) >= 4) {
          return NextResponse.json(
            { error: 'Максимум 4 аукциона могут быть на главной' },
            { status: 400 }
          );
        }
      }
    }

    const result = await pool.query(
      `UPDATE auctions 
       SET name = $1, additional_info = $2, starting_price = $3, auction_dates = $4,
           images = $5, category_id = $6, subcategory_ids = $7, is_featured = $8,
           certificate_url = $9, certificates = $10, detail_sections = $11, filter_values = $12, updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        name,
        additional_info,
        starting_price,
        auction_dates,
        images,
        category_id,
        subcategory_ids,
        is_featured,
        certificate_url,
        JSON.stringify(certificates || []),
        JSON.stringify(detail_sections || []),
        JSON.stringify(filter_values || {}),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Аукцион не найден' }, { status: 404 });
    }


    return NextResponse.json({ success: true, auction: result.rows[0] });
  } catch (error) {
    console.error('Ошибка обновления аукциона:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить аукцион
export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID аукциона обязателен' }, { status: 400 });
    }

    await pool.query('DELETE FROM auctions WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления аукциона:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

