/**
 * Демо-набор для запуска без Postgres (DATABASE_URL не задан).
 * Формы совпадают с ответами app/api/*, поэтому страницы и клиентская
 * фильтрация работают без изменений. Лоты вымышленные: имена и цены
 * детерминированно генерируются из той же таксономии категорий, что и
 * скрипт seed-catalog, без Math.random, чтобы превью не менялось от сборки к сборке.
 */

export interface DemoLot {
  id: number;
  name: string;
  additional_info: string;
  starting_price: string;
  auction_dates: string;
  images: string[];
  category: string;
  subcategory: string;
  category_id: number;
  subcategory_ids: number[];
  is_featured: boolean;
  certificate_url: string;
  certificates: Array<{ url: string; type: 'image' | 'pdf' }>;
  detail_sections: Array<{ title: string; content: string }>;
  filter_values: Record<string, string | number>;
  created_at: string;
  updated_at: string;
}

const IMAGES = [
  '/11.jpg', '/12.jpg', '/13.jpg', '/14.jpg', '/20.jpg',
  '/21.jpg', '/22.jpg', '/30.png', '/31.jpg', '/40.jpg', '/1.jpg', '/2.jpg',
];

const CATEGORIES: Array<{ name: string; slug: string; subcategories: string[] }> = [
  { name: 'Живопись', slug: 'painting', subcategories: ['Импрессионизм', 'Реализм', 'Абстракционизм', 'Портреты', 'Пейзажи', 'Натюрморты'] },
  { name: 'Часы', slug: 'watches', subcategories: ['Механические', 'Кварцевые', 'Автоматические', 'Винтажные', 'Лимитированные', 'Спортивные'] },
  { name: 'Мебель', slug: 'furniture', subcategories: ['Антикварная', 'Классическая', 'Современная', 'Винтажная', 'Ретро', 'Эксклюзивная'] },
  { name: 'Фарфор', slug: 'porcelain', subcategories: ['Императорский завод', 'Китайский', 'Европейский', 'Японский', 'Русский', 'Французский'] },
  { name: 'Автомобили', slug: 'cars', subcategories: ['Классические', 'Спортивные', 'Ретро', 'Лимитированные', 'Винтажные', 'Редкие'] },
  { name: 'Ювелирные изделия', slug: 'jewelry', subcategories: ['Кольца', 'Ожерелья', 'Браслеты', 'Серьги', 'Броши', 'Аксессуары'] },
  { name: 'Вино', slug: 'wine', subcategories: ['Bordeaux', 'Burgundy', 'Champagne', 'Итальянские', 'Испанские', 'Редкие'] },
  { name: 'Ковры', slug: 'carpets', subcategories: ['Персидские', 'Турецкие', 'Французские', 'Китайские', 'Антикварные', 'Эксклюзивные'] },
  { name: 'Скульптуры', slug: 'sculptures', subcategories: ['Мраморные', 'Бронзовые', 'Деревянные', 'Современные', 'Классические', 'Фигуративные'] },
  { name: 'Книги', slug: 'books', subcategories: ['Рукописи', 'Первые издания', 'Автографы', 'Редкие', 'Антикварные', 'Исторические'] },
  { name: 'Музыкальные инструменты', slug: 'instruments', subcategories: ['Скрипки', 'Фортепиано', 'Виолончели', 'Духовые', 'Струнные', 'Редкие'] },
  { name: 'Японское искусство', slug: 'japanese-art', subcategories: ['Гравюры', 'Керамика', 'Живопись', 'Скульптура', 'Каллиграфия', 'Лаковые изделия'] },
  { name: 'Монеты', slug: 'coins', subcategories: ['Античные', 'Средневековые', 'Императорские', 'Редкие', 'Золотые', 'Коллекционные'] },
  { name: 'Сумки и аксессуары', slug: 'bags', subcategories: ['Hermès', 'Chanel', 'Louis Vuitton', 'Винтажные', 'Эксклюзивные', 'Редкие'] },
  { name: 'Современное искусство', slug: 'contemporary', subcategories: ['Живопись', 'Скульптура', 'Инсталляции', 'Фотография', 'Цифровое искусство', 'Мультимедиа'] },
  { name: 'Оружие', slug: 'weapons', subcategories: ['Холодное оружие', 'Огнестрельное', 'Доспехи', 'Антикварное', 'Европейское', 'Редкое'] },
  { name: 'Минералы', slug: 'minerals', subcategories: ['Алмазы', 'Изумруды', 'Сапфиры', 'Рубины', 'Редкие камни', 'Коллекционные'] },
  { name: 'Карты', slug: 'maps', subcategories: ['Старинные', 'Морские', 'Географические', 'Исторические', 'Редкие', 'Коллекционные'] },
];

const LOTS_PER_CATEGORY = 6;

// Линейный congruential от категории и номера лота: один и тот же каталог
// на любой сборке и в демо-режиме, и в seed-скрипте.
function pseudo(seed: number): number {
  return ((seed * 1103515245 + 12345) % 2147483648) / 2147483648;
}

function priceOf(seed: number): number {
  return (Math.round(pseudo(seed) * 48) + 5) * 1_000_000 + Math.round(pseudo(seed + 7) * 900 + 100) * 1000;
}

function formatPrice(rubles: number): string {
  const millions = Math.floor(rubles / 1_000_000);
  const thousands = Math.floor((rubles % 1_000_000) / 1000);
  return `${millions} ${String(thousands).padStart(3, '0')} 000 ₽`;
}

export const demoCategories = CATEGORIES.map((category, index) => ({
  id: index + 1,
  name: category.name,
  slug: category.slug,
  image_url: IMAGES[index % IMAGES.length],
  sort_order: index + 1,
}));

export const demoLots: DemoLot[] = CATEGORIES.flatMap((category, categoryIndex) =>
  Array.from({ length: LOTS_PER_CATEGORY }, (_, lotIndex) => {
    const seed = categoryIndex * 100 + lotIndex;
    const price = priceOf(seed);
    const subcategory = category.subcategories[lotIndex % category.subcategories.length];
    const image = IMAGES[(categoryIndex + lotIndex) % IMAGES.length];
    const categoryId = categoryIndex + 1;
    const checkboxFilterId = categoryId * 10 + 1;
    const rangeFilterId = categoryId * 10 + 2;
    const month = ((categoryIndex + lotIndex) % 12) + 1;

    return {
      id: categoryId * 100 + lotIndex + 1,
      name: `${category.name}: ${subcategory.toLowerCase()} № ${lotIndex + 1}`,
      additional_info: `${subcategory} из собрания ${category.name.toLowerCase()}`,
      starting_price: formatPrice(price),
      auction_dates: `${String(month).padStart(2, '0')}.2026`,
      images: [image],
      category: category.slug,
      subcategory,
      category_id: categoryId,
      subcategory_ids: [],
      is_featured: lotIndex < 4 && categoryIndex % 3 === 0,
      certificate_url: '',
      certificates: [{ url: image, type: 'image' }],
      detail_sections: [
        { title: 'Детали продукта', content: `${subcategory}. Происхождение: частное собрание, Европа. Состояние: коллекционное.` },
        { title: 'Уход и обслуживание', content: 'Хранение при влажности 45-60 %, избегать прямого солнечного света.' },
        { title: 'Возврат и обмен', content: 'Возврат в течение 14 дней при сохранении сертификата подлинности.' },
      ],
      filter_values: { [checkboxFilterId]: subcategory, [rangeFilterId]: price },
      created_at: `2026-0${(categoryIndex % 9) + 1}-1${lotIndex}T09:00:00.000Z`,
      updated_at: `2026-0${(categoryIndex % 9) + 1}-1${lotIndex}T09:00:00.000Z`,
    };
  }),
);

export function demoAuctions({
  offset = 0,
  limit = 12,
  category = null,
  featured = false,
}: { offset?: number; limit?: number; category?: string | null; featured?: boolean } = {}) {
  let filtered = category ? demoLots.filter((lot) => lot.category === category) : demoLots;
  if (featured) filtered = filtered.filter((lot) => lot.is_featured);
  const page = filtered.slice(offset, offset + limit);
  return {
    auctions: page,
    hasMore: offset + limit < filtered.length,
    total: filtered.length,
    subcategories: category
      ? (CATEGORIES.find((item) => item.slug === category)?.subcategories ?? [])
      : [],
  };
}

export function demoAuction(id: number) {
  const auction = demoLots.find((lot) => lot.id === id);
  if (!auction) return null;
  return {
    auction,
    relatedAuctions: demoLots.filter((lot) => lot.category === auction.category && lot.id !== id).slice(0, 16),
  };
}

export function demoFilters(categorySlug: string | null) {
  if (!categorySlug) return { filters: [] };
  const categoryIndex = CATEGORIES.findIndex((item) => item.slug === categorySlug);
  if (categoryIndex < 0) return { filters: [] };
  const category = CATEGORIES[categoryIndex];
  const categoryId = categoryIndex + 1;

  return {
    filters: [
      {
        id: categoryId * 10 + 1,
        category_id: categoryId,
        name: 'Техника',
        type: 'checkbox',
        sort_order: 0,
        options: category.subcategories.map((value, index) => ({ id: index + 1, value })),
      },
      {
        id: categoryId * 10 + 2,
        category_id: categoryId,
        name: 'Стартовая цена',
        type: 'range',
        sort_order: 1,
        options: [],
      },
    ],
  };
}

export const demoDocuments = [
  { id: 1, title: 'Итоговый протокол торгов', file_url: '/documents/README.md', file_size: '3.1 КБ', file_type: 'PDF', document_date: '2026-01-18' },
  { id: 2, title: 'Протокол несостоявшихся торгов', file_url: '/documents/README.md', file_size: '2.4 КБ', file_type: 'PDF', document_date: '2026-01-15' },
  { id: 3, title: 'Отчёт об оценке коллекции', file_url: '/documents/README.md', file_size: '5.8 КБ', file_type: 'PDF', document_date: '2026-01-09' },
];
