// Наполняет базу категориями и лотами. Данные те же, что отдаёт демо-режим
// (lib/demo.ts), поэтому превью и боевая база после сидинга выглядят одинаково.
// Запуск: npm run db:seed
import pg from 'pg';
import { demoCategories, demoLots, demoDocuments } from '../lib/demo.ts';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

await client.connect();
try {
  await client.query('BEGIN');

  for (const category of demoCategories) {
    await client.query(
      `INSERT INTO auction_categories (id, name, slug, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url`,
      [category.id, category.name, category.slug, category.image_url, category.sort_order],
    );
  }

  for (const lot of demoLots) {
    await client.query(
      `INSERT INTO auctions
         (id, name, additional_info, starting_price, auction_dates, images, category, subcategory,
          category_id, is_featured, certificate_url, certificates, detail_sections, filter_values)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO NOTHING`,
      [
        lot.id, lot.name, lot.additional_info, lot.starting_price, lot.auction_dates,
        lot.images, lot.category, lot.subcategory, lot.category_id, lot.is_featured,
        lot.certificate_url, JSON.stringify(lot.certificates), JSON.stringify(lot.detail_sections),
        JSON.stringify(lot.filter_values),
      ],
    );
  }

  for (const doc of demoDocuments) {
    await client.query(
      `INSERT INTO documents (title, file_url, file_size, file_type, document_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [doc.title, doc.file_url, doc.file_size, doc.file_type, doc.document_date],
    );
  }

  // SERIAL стартует после максимального вставленного id
  await client.query(
    `SELECT setval(pg_get_serial_sequence('auctions', 'id'), (SELECT MAX(id) FROM auctions))`,
  );
  await client.query(
    `SELECT setval(pg_get_serial_sequence('auction_categories', 'id'), (SELECT MAX(id) FROM auction_categories))`,
  );

  await client.query('COMMIT');
  console.log(`категорий: ${demoCategories.length}, лотов: ${demoLots.length}, документов: ${demoDocuments.length}`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('сидинг не выполнен:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
