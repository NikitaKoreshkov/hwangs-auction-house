import { NextRequest, NextResponse } from 'next/server';
import pool, { hasDatabase } from '@/lib/db';
import { demoAuctions } from '@/lib/demo';

export async function GET(request: NextRequest) {
  // Параметры читаются до обращения к базе: тот же контракт отдаёт демо-набор
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '1000', 10);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured') === 'true';

  if (!hasDatabase) {
    return NextResponse.json(demoAuctions({ offset, limit, category, featured }));
  }

  try {
    // Получаем параметры пагинации и фильтрации из query string
    const sortBy = searchParams.get('sortBy') || 'relevance';

    // Формируем запрос с учетом фильтрации
    let countQuery = 'SELECT COUNT(*) FROM auctions';
    let query = 'SELECT * FROM auctions';
    const queryParams: any[] = [];
    const whereConditions: string[] = [];

    if (featured) {
      whereConditions.push('is_featured = true');
    }

    if (category) {
      // Сначала найдем ID категории по slug
      const categoryResult = await pool.query(
        'SELECT id FROM auction_categories WHERE slug = $1',
        [category]
      );
      
      if (categoryResult.rows.length > 0) {
        const paramIndex = queryParams.length + 1;
        whereConditions.push(`category_id = $${paramIndex}`);
        queryParams.push(categoryResult.rows[0].id);
      }
    }

    if (whereConditions.length > 0) {
      const whereClause = ' WHERE ' + whereConditions.join(' AND ');
      countQuery += whereClause;
      query += whereClause;
    }

    // Применяем сортировку
    if (sortBy === 'price-low') {
      // Сортировка по цене от низкой к высокой
      // Парсим цену из формата "5 123 000 ₽" - извлекаем все цифры и преобразуем в число
      query += ` ORDER BY (
        CASE 
          WHEN starting_price ~ '^[0-9]' THEN
            CAST(REGEXP_REPLACE(starting_price, '[^0-9]', '', 'g') AS BIGINT)
          ELSE 0
        END
      ) ASC`;
    } else if (sortBy === 'price-high') {
      // Сортировка по цене от высокой к низкой
      query += ` ORDER BY (
        CASE 
          WHEN starting_price ~ '^[0-9]' THEN
            CAST(REGEXP_REPLACE(starting_price, '[^0-9]', '', 'g') AS BIGINT)
          ELSE 0
        END
      ) DESC`;
    } else {
      // По умолчанию - по релевантности (id ASC)
      query += ' ORDER BY id ASC';
    }

    // Добавляем параметры limit и offset
    const limitParamIndex = queryParams.length + 1;
    const offsetParamIndex = queryParams.length + 2;
    query += ` LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
    queryParams.push(limit, offset);

    // Получаем общее количество аукционов
    const countParams = queryParams.slice(0, queryParams.length - 2); // Без limit и offset
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Получаем аукционы с пагинацией и фильтрацией
    const result = await pool.query(query, queryParams);

    const hasMore = offset + result.rows.length < totalCount;

    // Получаем уникальные подкатегории для текущей категории
    let subcategories: string[] = [];
    if (category) {
      // Находим ID категории по slug
      const categoryResult = await pool.query(
        'SELECT id FROM auction_categories WHERE slug = $1',
        [category]
      );
      
      if (categoryResult.rows.length > 0) {
        const categoryId = categoryResult.rows[0].id;
        
        // Получаем подкатегории этой категории
        const subcatResult = await pool.query(
          'SELECT name FROM auction_subcategories WHERE category_id = $1 ORDER BY sort_order ASC, name ASC',
          [categoryId]
        );
        subcategories = subcatResult.rows.map(row => row.name);
      }
    }

    return NextResponse.json({ 
      auctions: result.rows,
      hasMore,
      total: totalCount,
      subcategories: subcategories
    }, { status: 200 });
  } catch (error: any) {
    console.error('Ошибка при получении аукционов:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при получении аукционов' },
      { status: 500 }
    );
  }
}

