'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeroSection {
  videoUrl: string;
  isVideo: boolean;
  imageUrl: string;
  line1: string;
  line2: string;
  line3: string;
}

interface DescriptionSection {
  text: string;
}

interface Panel {
  image: string;
  subtitle: string;
  title: string;
  quote: string;
}

interface Category {
  season: string;
  title: string;
  image: string;
  category_id?: number;
  slug?: string;
}

interface AuctionCategory {
  id: number;
  name: string;
  slug: string;
}

interface TextImageSection {
  smallImage: string;
  bigImage: string;
  title: string;
  text: string;
}

interface ImperialSection {
  title: string;
  text: string;
  image: string;
}

export default function EditHomepage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Hero Section
  const [hero, setHero] = useState<HeroSection>({
    videoUrl: '/video.mp4',
    isVideo: true,
    imageUrl: '',
    line1: 'Аукционный Дом Hwang\'s',
    line2: 'Традиция эксклюзивных коллекций',
    line3: 'Первый в России аукционный дом по продаже предметов роскоши и эксклюзивных активов.',
  });

  // Description
  const [description, setDescription] = useState<DescriptionSection>({
    text: 'Hwang\'s — первый в России аукционный дом,\nчья экспертиза определяет вершину частных коллекций и активов.',
  });

  // Panels
  const [panels, setPanels] = useState<Panel[]>([
    {
      image: '/1.jpg',
      subtitle: 'ИСКУССТВО ПРЕЕМСТВЕННОСТИ',
      title: 'НАСЛЕДИЕ\nИ ВРЕМЯ',
      quote: '«Мы работаем с объектами, которые не подвластны времени. Наша роль — обеспечить бесшовный переход ценности от одного поколения коллекционеров к другому».',
    },
    {
      image: '/2.jpg',
      subtitle: 'ЭКСПЕРТИЗА ВЫСШЕЙ ПРОБЫ',
      title: 'БЕЗУПРЕЧНЫЙ\nВЫБОР',
      quote: '«Каждый лот в нашей коллекции проходит многоуровневую аутентификацию. Мы определяем вершину того, что может предложить рынок частных активов».',
    },
    {
      image: '/3.jpg',
      subtitle: 'ВНЕ ПУБЛИЧНОГО ПОЛЯ',
      title: 'ПРИВАТНЫЙ\nДОСТУП',
      quote: '«Для особых случаев мы предлагаем формат частных продаж. Конфиденциальное сопровождение сделок и доступ к закрытым коллекциям, которые никогда не появятся в открытых каталогах».',
    },
  ]);

  // Categories
  const [categories, setCategories] = useState<Category[]>([
    { season: 'COLLECTION 2025', title: 'Часы', image: '/20.jpg' },
    { season: 'COLLECTION 2025', title: 'Автомобили', image: '/21.jpg' },
    { season: 'COLLECTION 2025', title: 'Ювелирные изделия', image: '/22.jpg' },
  ]);
  const [availableCategories, setAvailableCategories] = useState<AuctionCategory[]>([]);

  // Text & Image Section
  const [textImage, setTextImage] = useState<TextImageSection>({
    smallImage: '/31.jpg',
    bigImage: '/30.png',
    title: 'Искусство эксклюзивных\nколлекций',
    text: 'Созданные из редчайших материалов и бесценных артефактов, наши коллекции ценятся за уникальную историческую ценность и непревзойденное качество.',
  });

  // Imperial Section
  const [imperial, setImperial] = useState<ImperialSection>({
    title: 'Коллекция Императорского Двора',
    text: 'Классическая и вневременная, первая завершенная коллекция Hwang\'s, созданная из драгоценных материалов императорской эпохи. Воплощение превосходных материалов, вечной элегантности и абсолютного комфорта. Символический мост между текстильным наследием Дома и современной коллекцией аксессуаров.',
    image: '/40.jpg',
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Загружаем содержимое главной страницы
        const response = await fetch('/api/admin/homepage');
        if (response.ok) {
          const data = await response.json();
          
          // Загружаем данные если они есть в БД
          if (data.hero) setHero(data.hero);
          if (data.description) setDescription(data.description);
          if (data.panels) setPanels(data.panels);
          if (data.categories) {
            // Всегда оставляем ровно 3 категории
            const cats = data.categories.slice(0, 3);
            // Дополняем до 3 если меньше
            while (cats.length < 3) {
              cats.push({ season: 'COLLECTION 2025', title: '', image: '' });
            }
            setCategories(cats);
          }
          if (data.textImage) setTextImage(data.textImage);
          if (data.imperial) setImperial(data.imperial);
        } else if (response.status === 401) {
          router.push('/admin/login');
        }

        // Загружаем список всех категорий аукциона
        const categoriesResponse = await fetch('/api/admin/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setAvailableCategories(categoriesData.categories || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [router]);

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Ошибка загрузки файла');
    }

    const data = await response.json();
    return data.url;
  };

  const saveSection = async (section: string, data: any) => {
    const response = await fetch('/api/admin/homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, data }),
    });

    if (!response.ok) {
      throw new Error('Ошибка сохранения');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage('');

    try {
      const categoriesToSave = categories.slice(0, 3);
      
      await Promise.all([
        saveSection('hero', hero),
        saveSection('description', description),
        saveSection('panels', panels),
        saveSection('categories', categoriesToSave), // Только первые 3
        saveSection('textImage', textImage),
        saveSection('imperial', imperial),
      ]);

      setMessage('Все изменения сохранены успешно!');
    } catch (error) {
      setMessage('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p style={{ fontFamily: 'var(--font-open-sans)' }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Шапка */}
      <header className="border-b border-gray-200 py-4 sticky top-0 bg-white z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm hover:underline"
              style={{ fontFamily: 'var(--font-open-sans)' }}
            >
              ← Назад
            </Link>
            <h1
              className="text-xl"
              style={{ fontFamily: 'var(--font-playfair-display)' }}
            >
              Редактирование основной страницы
            </h1>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            style={{
              fontFamily: 'var(--font-open-sans)',
              fontSize: '14px',
              letterSpacing: '0.05em',
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить все'}
          </button>
        </div>
      </header>

      {message && (
        <div className={`py-3 px-6 text-center ${message.includes('Ошибка') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Контент */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* 1. Hero Section */}
          <section className="border border-gray-200 p-6">
            <h2
              className="text-xl mb-6"
              style={{ fontFamily: 'var(--font-playfair-display)' }}
            >
              1. Hero блок (видео/фото и текст)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={hero.isVideo}
                    onChange={(e) => setHero({ ...hero, isVideo: e.target.checked })}
                  />
                  <span style={{ fontFamily: 'var(--font-open-sans)', fontSize: '14px' }}>
                    Использовать видео (иначе фото)
                  </span>
                </label>
              </div>

              {hero.isVideo ? (
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ fontFamily: 'var(--font-open-sans)' }}
                  >
                    Видео
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await handleFileUpload(e.target.files[0]);
                        setHero({ ...hero, videoUrl: url });
                      }
                    }}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">Текущее: {hero.videoUrl}</p>
                </div>
              ) : (
                <div>
                  <label
                    className="block text-sm mb-2"
                    style={{ fontFamily: 'var(--font-open-sans)' }}
                  >
                    Фото
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await handleFileUpload(e.target.files[0]);
                        setHero({ ...hero, imageUrl: url });
                      }
                    }}
                    className="mb-2"
                  />
                  {hero.imageUrl && (
                    <img src={hero.imageUrl} alt="Hero" className="w-32 h-32 object-cover mt-2" />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Строка 1 (маленькая)
                </label>
                <input
                  type="text"
                  value={hero.line1}
                  onChange={(e) => setHero({ ...hero, line1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Строка 2 (заголовок)
                </label>
                <input
                  type="text"
                  value={hero.line2}
                  onChange={(e) => setHero({ ...hero, line2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ fontFamily: 'var(--font-open-sans)' }}>
                  Строка 3 (описание)
                </label>
                <input
                  type="text"
                  value={hero.line3}
                  onChange={(e) => setHero({ ...hero, line3: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300"
                  style={{ fontFamily: 'var(--font-open-sans)' }}
                />
              </div>
            </div>
          </section>

          {/* 2. Description */}
          <section className="border border-gray-200 p-6">
            <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
              2. Описание
            </h2>
            <textarea
              value={description.text}
              onChange={(e) => setDescription({ text: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300"
              style={{ fontFamily: 'var(--font-open-sans)' }}
            />
          </section>

          {/* 3. Panels */}
          <section className="border border-gray-200 p-6">
            <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
              3. Три панели с текстом и фото
            </h2>
            
            {panels.map((panel, index) => (
              <div key={index} className="mb-8 pb-8 border-b last:border-b-0">
                <h3 className="font-bold mb-4">Панель {index + 1}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Фото</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          const newPanels = [...panels];
                          newPanels[index].image = url;
                          setPanels(newPanels);
                        }
                      }}
                      className="mb-2"
                    />
                    <img src={panel.image} alt="" className="w-32 h-32 object-cover" />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Подзаголовок</label>
                    <input
                      type="text"
                      value={panel.subtitle}
                      onChange={(e) => {
                        const newPanels = [...panels];
                        newPanels[index].subtitle = e.target.value;
                        setPanels(newPanels);
                      }}
                      className="w-full px-4 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Заголовок</label>
                    <textarea
                      value={panel.title}
                      onChange={(e) => {
                        const newPanels = [...panels];
                        newPanels[index].title = e.target.value;
                        setPanels(newPanels);
                      }}
                      rows={2}
                      className="w-full px-4 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Цитата</label>
                    <textarea
                      value={panel.quote}
                      onChange={(e) => {
                        const newPanels = [...panels];
                        newPanels[index].quote = e.target.value;
                        setPanels(newPanels);
                      }}
                      rows={3}
                      className="w-full px-4 py-2 border"
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* 4. Categories */}
          <section className="border border-gray-200 p-6">
            <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
              4. Категории (всегда 3 шт)
            </h2>
            
            {categories.slice(0, 3).map((cat, index) => (
              <div key={index} className="mb-6 pb-6 border-b last:border-b-0">
                <h3 className="font-bold mb-4">Категория {index + 1}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Фото</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          const newCats = [...categories];
                          newCats[index].image = url;
                          setCategories(newCats);
                        }
                      }}
                      className="mb-2"
                    />
                    <img src={cat.image} alt="" className="w-32 h-32 object-cover" />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Текст коллекции (COLLECTION 2025)</label>
                    <input
                      type="text"
                      value={cat.season}
                      onChange={(e) => {
                        const newCats = [...categories];
                        newCats[index].season = e.target.value;
                        setCategories(newCats);
                      }}
                      className="w-full px-4 py-2 border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Категория аукциона</label>
                    <select
                      value={cat.category_id || ''}
                      onChange={(e) => {
                        const newCats = [...categories];
                        const selectedId = parseInt(e.target.value);
                        const selectedCategory = availableCategories.find(c => c.id === selectedId);
                        
                        newCats[index].category_id = selectedId;
                        newCats[index].title = selectedCategory?.name || '';
                        newCats[index].slug = selectedCategory?.slug || '';
                        setCategories(newCats);
                      }}
                      className="w-full px-4 py-2 border"
                    >
                      <option value="">Выберите категорию</option>
                      {availableCategories.map((availCat) => (
                        <option key={availCat.id} value={availCat.id}>
                          {availCat.name}
                        </option>
                      ))}
                    </select>
                    {cat.title && (
                      <p className="text-sm text-gray-600 mt-2">Выбрано: {cat.title} ({cat.slug})</p>
                    )}
                  </div>
                </div>
              </div>
              ))}
          </section>

          {/* 5. Text & Image */}
          <section className="border border-gray-200 p-6">
            <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
              5. Блок с малым и большим фото
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Малое фото</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const url = await handleFileUpload(e.target.files[0]);
                      setTextImage({ ...textImage, smallImage: url });
                    }
                  }}
                  className="mb-2"
                />
                <img src={textImage.smallImage} alt="" className="w-32 h-32 object-cover" />
              </div>

              <div>
                <label className="block text-sm mb-2">Большое фото</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const url = await handleFileUpload(e.target.files[0]);
                      setTextImage({ ...textImage, bigImage: url });
                    }
                  }}
                  className="mb-2"
                />
                <img src={textImage.bigImage} alt="" className="w-32 h-32 object-cover" />
              </div>

              <div>
                <label className="block text-sm mb-2">Заголовок</label>
                <textarea
                  value={textImage.title}
                  onChange={(e) => setTextImage({ ...textImage, title: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Текст</label>
                <textarea
                  value={textImage.text}
                  onChange={(e) => setTextImage({ ...textImage, text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border"
                />
              </div>
            </div>
          </section>

          {/* 6. Imperial Collection */}
          <section className="border border-gray-200 p-6">
            <h2 className="text-xl mb-6" style={{ fontFamily: 'var(--font-playfair-display)' }}>
              6. Коллекция Императорского Двора
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Заголовок</label>
                <input
                  type="text"
                  value={imperial.title}
                  onChange={(e) => setImperial({ ...imperial, title: e.target.value })}
                  className="w-full px-4 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Текст</label>
                <textarea
                  value={imperial.text}
                  onChange={(e) => setImperial({ ...imperial, text: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Фото</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      const url = await handleFileUpload(e.target.files[0]);
                      setImperial({ ...imperial, image: url });
                    }
                  }}
                  className="mb-2"
                />
                <img src={imperial.image} alt="" className="w-32 h-32 object-cover" />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

