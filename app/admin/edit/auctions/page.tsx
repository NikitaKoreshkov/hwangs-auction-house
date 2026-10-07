'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  sort_order: number;
  subcategories: Subcategory[];
  auction_count?: number;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  sort_order: number;
}

interface Auction {
  id: number;
  name: string;
  additional_info?: string;
  starting_price: string;
  auction_dates?: string;
  images: string[];
  category_id?: number | null;
  category_name?: string;
  subcategory_ids: number[];
  is_featured: boolean;
  certificate_url?: string;
  certificates?: Array<{
    url: string;
    type: 'image' | 'pdf';
  }>;
  detail_sections?: Array<{
    title: string;
    content: string;
  }>;
  filter_values?: { [key: string]: any };
}

type Certificate = { url: string; type: 'image' | 'pdf' };

// Колонка certificates приезжает то массивом, то JSON-строкой, поэтому её тип
// нельзя вывести из значения — разбираем явно и отбрасываем мусор.
function parseCertificates(raw: string | Auction['certificates']): Certificate[] {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch (e) {
      console.error('Ошибка парсинга certificates:', e);
      value = [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Certificate =>
      !!item && typeof item.url === 'string' && (item.type === 'image' || item.type === 'pdf'),
  );
}

type DetailSection = { title: string; content: string };

// Форма всегда держит заполненные массивы и null вместо отсутствующего поля,
// иначе на каждом вводе приходится проверять undefined.
type AuctionForm = Omit<Auction, 'id' | 'certificates' | 'detail_sections'> & {
  certificates: Certificate[];
  detail_sections: DetailSection[];
};

interface Filter {
  id: number;
  category_id: number;
  name: string;
  type: 'checkbox' | 'range' | 'text';
  sort_order: number;
  options?: Array<{
    id: number;
    value: string;
  }>;
}

export default function EditAuctions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  
  const [activeTab, setActiveTab] = useState<'categories' | 'auctions'>('categories');
  
  // Модальные окна
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  
  const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, auctionsRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/auctions'),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (auctionsRes.ok) {
        const data = await auctionsRes.json();
        // Парсим certificates для каждого аукциона, если это строка JSON
        const parsedAuctions = (data.auctions || []).map((auction: any) => {
          if (auction.certificates && typeof auction.certificates === 'string') {
            try {
              auction.certificates = JSON.parse(auction.certificates);
            } catch (e) {
              console.error('Ошибка парсинга certificates:', e);
              auction.certificates = [];
            }
          }
          return auction;
        });
        setAuctions(parsedAuctions);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Ошибка загрузки файла');

    const data = await response.json();
    return data.url;
  };

  // Категории
  const handleSaveCategory = async (category: Partial<Category>) => {
    try {
      const method = category.id ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (response.ok) {
        setMessage('Категория сохранена');
        setShowCategoryForm(false);
        setEditingCategory(null);
        loadData();
      } else {
        setMessage('Ошибка сохранения категории');
      }
    } catch (error) {
      setMessage('Ошибка сохранения категории');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию? Все связанные лоты останутся без категории.')) return;

    try {
      const response = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('Категория удалена');
        loadData();
      }
    } catch (error) {
      setMessage('Ошибка удаления');
    }
  };

  // Подкатегории
  const handleSaveSubcategory = async (subcategory: Partial<Subcategory>) => {
    try {
      const method = subcategory.id ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/subcategories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subcategory),
      });

      if (response.ok) {
        setMessage('Подкатегория сохранена');
        setShowSubcategoryForm(false);
        setEditingSubcategory(null);
        setSelectedCategoryForSubcategory(null);
        loadData();
      } else {
        setMessage('Ошибка сохранения подкатегории');
      }
    } catch (error) {
      setMessage('Ошибка сохранения подкатегории');
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm('Удалить подкатегорию?')) return;

    try {
      const response = await fetch(`/api/admin/subcategories?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('Подкатегория удалена');
        loadData();
      }
    } catch (error) {
      setMessage('Ошибка удаления');
    }
  };

  // Аукционы
  const handleSaveAuction = async (auction: Partial<Auction>) => {
    try {
      const method = auction.id ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/auctions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auction),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Лот сохранен');
        setShowAuctionForm(false);
        setEditingAuction(null);
        loadData();
      } else {
        setMessage(data.error || 'Ошибка сохранения лота');
      }
    } catch (error) {
      setMessage('Ошибка сохранения лота');
    }
  };

  const handleDeleteAuction = async (id: number) => {
    if (!confirm('Удалить лот?')) return;

    try {
      const response = await fetch(`/api/admin/auctions?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('Лот удален');
        loadData();
      }
    } catch (error) {
      setMessage('Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Загрузка...</p>
      </div>
    );
  }

  const featuredCount = auctions.filter(a => a.is_featured).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Шапка */}
      <header className="border-b border-gray-200 py-4 sticky top-0 bg-white z-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="text-sm hover:underline">
                ← Назад
              </Link>
              <h1 className="text-xl" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                Управление аукционами
              </h1>
            </div>
          </div>
          
          {/* Табы */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-2 px-4 ${activeTab === 'categories' ? 'border-b-2 border-black' : 'text-gray-500'}`}
            >
              Категории и фильтры
            </button>
            <button
              onClick={() => setActiveTab('auctions')}
              className={`pb-2 px-4 ${activeTab === 'auctions' ? 'border-b-2 border-black' : 'text-gray-500'}`}
            >
              Лоты
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className={`py-3 px-6 text-center ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {/* TAB: Категории */}
        {activeTab === 'categories' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                Категории ({categories.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => loadData()}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50"
                >
                  🔄 Обновить
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryForm(true);
                  }}
                  className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                >
                  + Добавить категорию
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      {cat.image_url && (
                        <img src={cat.image_url} alt="" className="w-20 h-20 object-cover" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">{cat.name}</h3>
                        <p className="text-sm text-gray-500">Slug: {cat.slug}</p>
                        <p className="text-sm text-gray-700 font-medium">Товаров: {cat.auction_count || 0}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowCategoryForm(true);
                        }}
                        className="px-3 py-1 text-sm border border-black hover:bg-black hover:text-white"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="px-3 py-1 text-sm border border-red-500 text-red-500 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Аукционы */}
        {activeTab === 'auctions' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                  Лоты ({auctions.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  На главной: {featuredCount}/4
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAuction(null);
                  setShowAuctionForm(true);
                }}
                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
              >
                + Добавить лот
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auction) => (
                <div key={auction.id} className="border border-gray-200 p-4">
                  {auction.images[0] && (
                    <img
                      src={auction.images[0]}
                      alt={auction.name}
                      className="w-full h-48 object-cover mb-3"
                    />
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{auction.name}</h3>
                    {auction.is_featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        На главной
                      </span>
                    )}
                  </div>
                  
                  {auction.additional_info && (
                    <p className="text-sm text-gray-600 mb-2">{auction.additional_info}</p>
                  )}
                  
                  <p className="text-sm mb-1">
                    <strong>Цена:</strong> {auction.starting_price}
                  </p>
                  
                  {auction.category_name && (
                    <p className="text-sm mb-1">
                      <strong>Категория:</strong> {auction.category_name}
                    </p>
                  )}
                  
                  {auction.auction_dates && (
                    <p className="text-sm mb-3">
                      <strong>Даты:</strong> {auction.auction_dates}
                    </p>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingAuction(auction);
                        setShowAuctionForm(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-black hover:bg-black hover:text-white"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteAuction(auction.id)}
                      className="px-3 py-2 text-sm border border-red-500 text-red-500 hover:bg-red-50"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модалки будут следующими */}
      {(showCategoryForm || showSubcategoryForm || showAuctionForm) && (
        <CategoryFormModal
          show={showCategoryForm}
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          onFileUpload={handleFileUpload}
        />
      )}

      {showSubcategoryForm && (
        <SubcategoryFormModal
          show={showSubcategoryForm}
          subcategory={editingSubcategory}
          categoryId={selectedCategoryForSubcategory}
          onSave={handleSaveSubcategory}
          onClose={() => {
            setShowSubcategoryForm(false);
            setEditingSubcategory(null);
            setSelectedCategoryForSubcategory(null);
          }}
        />
      )}

      {showAuctionForm && (
        <AuctionFormModal
          show={showAuctionForm}
          auction={editingAuction}
          categories={categories}
          onSave={handleSaveAuction}
          onClose={() => {
            setShowAuctionForm(false);
            setEditingAuction(null);
          }}
          onFileUpload={handleFileUpload}
          featuredCount={featuredCount}
        />
      )}
    </div>
  );
}

// Модальное окно категории
function CategoryFormModal({
  show,
  category,
  onSave,
  onClose,
  onFileUpload,
}: {
  show: boolean;
  category: Category | null;
  onSave: (cat: Partial<Category>) => void;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<string>;
}) {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    image_url: category?.image_url || '',
    sort_order: category?.sort_order || 0,
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
          {category ? 'Редактировать категорию' : 'Добавить категорию'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Slug (для URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-4 py-2 border"
              placeholder="watches, cars, jewelry"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Фото</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const url = await onFileUpload(e.target.files[0]);
                  setForm({ ...form, image_url: url });
                }
              }}
              className="mb-2"
            />
            {form.image_url && <img src={form.image_url} alt="" className="w-32 h-32 object-cover" />}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onSave({ ...form, id: category?.id })}
              className="flex-1 py-2 bg-black text-white hover:bg-gray-800"
            >
              Сохранить
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 hover:bg-gray-100"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Модальное окно подкатегории
function SubcategoryFormModal({
  show,
  subcategory,
  categoryId,
  onSave,
  onClose,
}: {
  show: boolean;
  subcategory: Subcategory | null;
  categoryId: number | null;
  onSave: (sub: Partial<Subcategory>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: subcategory?.name || '',
    slug: subcategory?.slug || '',
    sort_order: subcategory?.sort_order || 0,
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 max-w-lg w-full">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
          {subcategory ? 'Редактировать фильтр' : 'Добавить фильтр'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-4 py-2 border"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onSave({ ...form, id: subcategory?.id, category_id: categoryId || undefined })}
              className="flex-1 py-2 bg-black text-white hover:bg-gray-800"
            >
              Сохранить
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 hover:bg-gray-100"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Модальное окно аукциона
function AuctionFormModal({
  show,
  auction,
  categories,
  onSave,
  onClose,
  onFileUpload,
  featuredCount,
}: {
  show: boolean;
  auction: Auction | null;
  categories: Category[];
  onSave: (auction: Partial<Auction>) => void;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<string>;
  featuredCount: number;
}) {
  const [form, setForm] = useState<AuctionForm>({
    name: auction?.name || '',
    additional_info: auction?.additional_info || '',
    starting_price: auction?.starting_price || '',
    auction_dates: auction?.auction_dates || '',
    images: auction?.images || [],
    category_id: auction?.category_id || null,
    subcategory_ids: auction?.subcategory_ids || [],
    is_featured: auction?.is_featured || false,
    certificate_url: auction?.certificate_url || '',
    certificates: parseCertificates(auction?.certificates ?? []),
    detail_sections: auction?.detail_sections || [
      { title: 'Детали продукта', content: '' },
      { title: 'Уход и обслуживание', content: '' },
      { title: 'Возврат и обмен', content: '' },
    ],
    filter_values: auction?.filter_values || {},
  });

  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Загружаем фильтры при смене категории
  useEffect(() => {
    if (form.category_id) {
      loadFilters(form.category_id);
    } else {
      setFilters([]);
    }
  }, [form.category_id]);

  // Логируем filter_values при изменении
  useEffect(() => {
  }, [form.filter_values]);

  const loadFilters = async (categoryId: number) => {
    setLoadingFilters(true);
    try {
      const response = await fetch(`/api/admin/filters?category_id=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setFilters(data.filters || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки фильтров:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === form.category_id);
  const canBeFeatured = form.is_featured || featuredCount < 4;

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 max-w-4xl w-full my-8">
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
          {auction ? 'Редактировать лот' : 'Добавить лот'}
        </h2>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm mb-1">Название лота *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Дополнительная информация</label>
            <input
              type="text"
              value={form.additional_info}
              onChange={(e) => setForm({ ...form, additional_info: e.target.value })}
              className="w-full px-4 py-2 border"
              placeholder="Например: Импрессионизм"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Начальная цена *</label>
            <input
              type="text"
              value={form.starting_price}
              onChange={(e) => setForm({ ...form, starting_price: e.target.value })}
              className="w-full px-4 py-2 border"
              placeholder="От 13 773 000 ₽"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Сроки проведения</label>
            <input
              type="text"
              value={form.auction_dates}
              onChange={(e) => setForm({ ...form, auction_dates: e.target.value })}
              className="w-full px-4 py-2 border"
              placeholder="12.01.25 - 30.01.25"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Категория</label>
            <select
              value={form.category_id || ''}
              onChange={(e) => setForm({ ...form, category_id: e.target.value ? parseInt(e.target.value) : null, subcategory_ids: [] })}
              className="w-full px-4 py-2 border"
            >
              <option value="">Без категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <div>
              <label className="block text-sm mb-2">Подкатегории (старые)</label>
              <div className="space-y-2 border border-gray-200 p-3 max-h-40 overflow-y-auto">
                {selectedCategory.subcategories.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.subcategory_ids.includes(sub.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, subcategory_ids: [...form.subcategory_ids, sub.id] });
                        } else {
                          setForm({ ...form, subcategory_ids: form.subcategory_ids.filter(id => id !== sub.id) });
                        }
                      }}
                    />
                    <span className="text-sm">{sub.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Новая система фильтров */}
          {form.category_id && (
            <div>
              <label className="block text-sm mb-2 font-bold">Фильтры для категории</label>
              {loadingFilters ? (
                <p className="text-sm text-gray-500">Загрузка фильтров...</p>
              ) : filters.length === 0 ? (
                <p className="text-sm text-gray-500">Нет фильтров для этой категории</p>
              ) : (
                <div className="space-y-4 border border-gray-200 p-4 max-h-96 overflow-y-auto">
                  {filters.map(filter => (
                    <div key={filter.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <label className="block text-sm font-medium mb-2">{filter.name}</label>
                      
                      {/* Чекбоксы */}
                      {filter.type === 'checkbox' && filter.options && (
                        <div className="space-y-1">
                          {filter.options.map(option => (
                            <label key={option.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={form.filter_values?.[filter.id]?.includes(option.value) || false}
                                onChange={(e) => {
                                  const currentValues = form.filter_values?.[filter.id] || [];
                                  const newValues = e.target.checked
                                    ? [...currentValues, option.value]
                                    : currentValues.filter((v: string) => v !== option.value);
                                  setForm({
                                    ...form,
                                    filter_values: {
                                      ...form.filter_values,
                                      [filter.id]: newValues,
                                    },
                                  });
                                }}
                              />
                              <span className="text-sm">{option.value}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {/* Диапазон */}
                      {filter.type === 'range' && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            placeholder="От"
                            value={
                              form.filter_values?.[filter.id]?.min !== undefined 
                                ? form.filter_values[filter.id].min 
                                : ''
                            }
                            onChange={(e) => {
                              const currentValues = form.filter_values?.[filter.id] || { min: '', max: '' };
                              setForm({
                                ...form,
                                filter_values: {
                                  ...form.filter_values,
                                  [filter.id]: {
                                    ...currentValues,
                                    min: e.target.value,
                                  },
                                },
                              });
                            }}
                            className="w-24 px-2 py-1 border text-sm"
                          />
                          <span className="text-sm">—</span>
                          <input
                            type="number"
                            placeholder="До"
                            value={
                              form.filter_values?.[filter.id]?.max !== undefined 
                                ? form.filter_values[filter.id].max 
                                : ''
                            }
                            onChange={(e) => {
                              const currentValues = form.filter_values?.[filter.id] || { min: '', max: '' };
                              setForm({
                                ...form,
                                filter_values: {
                                  ...form.filter_values,
                                  [filter.id]: {
                                    ...currentValues,
                                    max: e.target.value,
                                  },
                                },
                              });
                            }}
                            className="w-24 px-2 py-1 border text-sm"
                          />
                        </div>
                      )}
                      
                      {/* Текст */}
                      {filter.type === 'text' && (
                        <input
                          type="text"
                          value={form.filter_values?.[filter.id] || ''}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              filter_values: {
                                ...form.filter_values,
                                [filter.id]: e.target.value,
                              },
                            });
                          }}
                          className="w-full px-3 py-2 border text-sm"
                          placeholder="Введите значение"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                disabled={!canBeFeatured}
              />
              <span className="text-sm">Показывать на главной (макс. 4)</span>
            </label>
            {!canBeFeatured && (
              <p className="text-xs text-red-600 mt-1">Уже выбрано 4 лота для главной</p>
            )}
          </div>

          <div className="border-t border-gray-300 pt-4">
            <label className="block text-sm font-bold mb-1">
              Фотографии лота
              <span className="font-normal text-xs text-gray-600 ml-2">
                (будут показаны в галерее на странице лота)
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Первая фотография будет главной. Можно загрузить несколько фото сразу.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={async (e) => {
                if (e.target.files) {
                  setUploading(true);
                  const files = Array.from(e.target.files);
                  const urls = [];
                  
                  for (const file of files) {
                    try {
                      const url = await onFileUpload(file);
                      urls.push(url);
                    } catch (error) {
                      console.error('Ошибка загрузки:', error);
                    }
                  }
                  
                  setForm({ ...form, images: [...form.images, ...urls] });
                  setUploading(false);
                }
              }}
              className="mb-2"
            />
            {uploading && <p className="text-sm text-gray-600">Загрузка...</p>}
            
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {form.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt="" className="w-full h-24 object-cover rounded border" />
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white px-2 py-0.5 text-xs rounded">
                        Главная
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== index) })}
                      className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white px-1.5 py-0.5 text-xs rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-300 pt-4">
            <label className="block text-sm font-bold mb-1">
              Сертификаты подлинности
              <span className="font-normal text-xs text-gray-600 ml-2">
                (можно загрузить несколько файлов: изображения JPG/PNG или PDF)
              </span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Поддерживаются форматы: JPG, PNG, PDF. Можно загрузить несколько файлов сразу.
            </p>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              disabled={uploading}
              onChange={async (e) => {
                if (e.target.files) {
                  setUploading(true);
                  const files = Array.from(e.target.files);
                  const newCertificates: Certificate[] = [];
                  
                  for (const file of files) {
                    try {
                      const url = await onFileUpload(file);
                      const type = file.type.startsWith('image/') ? 'image' : 'pdf';
                      newCertificates.push({ url, type });
                    } catch (error) {
                      console.error('Ошибка загрузки:', error);
                    }
                  }
                  
                  setForm({ ...form, certificates: [...form.certificates, ...newCertificates] });
                  setUploading(false);
                }
              }}
              className="mb-2"
            />
            {uploading && <p className="text-sm text-gray-600">Загрузка...</p>}
            
            {form.certificates.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {form.certificates.map((cert, index) => (
                  <div key={index} className="relative group border border-gray-200 rounded p-2">
                    {cert.type === 'image' ? (
                      <img 
                        src={cert.url} 
                        alt={`Сертификат ${index + 1}`} 
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-600">PDF</p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, certificates: form.certificates.filter((_, i) => i !== index) })}
                      className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white px-1.5 py-0.5 text-xs rounded">
                      {cert.type === 'image' ? 'IMG' : 'PDF'}
                    </div>
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded"
                    >
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100">Открыть</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Дополнительные секции (аккордеоны) */}
          <div className="border-t border-gray-300 pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold">Дополнительные секции (аккордеоны)</label>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    detail_sections: [...form.detail_sections, { title: '', content: '' }]
                  });
                }}
                className="text-sm px-3 py-1 border border-gray-400 hover:bg-gray-100"
              >
                + Добавить секцию
              </button>
            </div>
            
            <div className="space-y-4">
              {form.detail_sections.map((section, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-semibold">Секция {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = form.detail_sections.filter((_, i) => i !== index);
                        setForm({ ...form, detail_sections: newSections });
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs mb-1">Заголовок</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...form.detail_sections];
                          newSections[index].title = e.target.value;
                          setForm({ ...form, detail_sections: newSections });
                        }}
                        className="w-full px-3 py-2 border text-sm"
                        placeholder="Например: Детали продукта"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs mb-1">Содержимое</label>
                      <textarea
                        value={section.content}
                        onChange={(e) => {
                          const newSections = [...form.detail_sections];
                          newSections[index].content = e.target.value;
                          setForm({ ...form, detail_sections: newSections });
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border text-sm"
                        placeholder="Текст для этой секции..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-6 mt-6 border-t">
          <button
            onClick={() => onSave({ ...form, id: auction?.id })}
            className="flex-1 py-3 bg-black text-white hover:bg-gray-800"
          >
            Сохранить
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 border border-gray-300 hover:bg-gray-100"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

