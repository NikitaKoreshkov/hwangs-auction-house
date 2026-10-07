import { NextRequest, NextResponse } from 'next/server';
import pool, { hasDatabase } from '@/lib/db';
import { demoDocuments } from '@/lib/demo';

// GET - получить все документы с фильтрацией и сортировкой
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const sortOrder = searchParams.get('sort') || 'desc'; // desc = новые первые, asc = старые первые
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!hasDatabase) {
    const from = startDate ? new Date(startDate).getTime() : 0;
    const to = endDate ? new Date(endDate).getTime() : Infinity;
    const documents = demoDocuments
      .filter((doc) => !search || doc.title.toLowerCase().includes(search.toLowerCase()))
      .filter((doc) => {
        const at = new Date(doc.document_date).getTime();
        return at >= from && at <= to;
      })
      .sort((a, b) =>
        sortOrder === 'asc'
          ? a.document_date.localeCompare(b.document_date)
          : b.document_date.localeCompare(a.document_date),
      );
    return NextResponse.json({ documents, count: documents.length });
  }

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        id, 
        title, 
        file_url, 
        file_size, 
        file_type,
        document_date,
        created_at
      FROM documents
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    // Фильтр по поиску
    if (search) {
      query += ` AND LOWER(title) LIKE LOWER($${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Фильтр по диапазону дат
    if (startDate) {
      query += ` AND document_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND document_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Сортировка
    query += ` ORDER BY document_date ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

    const result = await client.query(query, params);

    return NextResponse.json({
      documents: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Ошибка при получении документов:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении документов' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
