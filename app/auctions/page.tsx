'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuctionCard from '../components/AuctionCard';

interface Auction {
  id: number;
  name: string;
  additional_info?: string;
  starting_price: string;
  auction_dates?: string; // Срок проведения аукциона
  images: string[];
  filter_values?: { [key: string]: any };
}

interface Filter {
  id: number;
  name: string;
  type: 'checkbox' | 'range' | 'text';
  options?: Array<{ id: number; value: string }>;
}

function AuctionsView() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isFiltersAnimating, setIsFiltersAnimating] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSortAnimating, setIsSortAnimating] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const ITEMS_PER_PAGE = 22;
  
  // Новая система фильтров
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: number]: any }>({});
  
  // Состояния для формы подписки
  const [email, setEmail] = useState('');
  const [subscriptionMessage, setSubscriptionMessage] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Состояния для раскрытия секций футера на мобильных
  const [openFooterSections, setOpenFooterSections] = useState<Record<string, boolean>>({});

  const toggleFooterSection = (section: string) => {
    setOpenFooterSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchAuctions = async (offset = 0, categoryParam: string | null = null) => {
    try {
      const url = categoryParam 
        ? `/api/auctions?offset=${offset}&limit=${ITEMS_PER_PAGE}&category=${encodeURIComponent(categoryParam)}`
        : `/api/auctions?offset=${offset}&limit=${ITEMS_PER_PAGE}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (offset === 0) {
        setAuctions(data.auctions || []);
        setTotalCount(data.total || 0);
        // Сохраняем подкатегории для фильтров
        if (data.subcategories) {
          setAvailableSubcategories(data.subcategories);
        } else {
          setAvailableSubcategories([]);
        }
      } else {
        setAuctions(prev => [...prev, ...(data.auctions || [])]);
      }
      
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Ошибка при загрузке аукционов:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Функция для парсинга цены из строки
  const parsePrice = (priceString: string): number => {
    // Удаляем все нецифровые символы и преобразуем в число
    const numbers = priceString.replace(/[^0-9]/g, '');
    return parseInt(numbers, 10) || 0;
  };

  // Функция проверки соответствия лота фильтрам
  const matchesFilters = (auction: Auction): boolean => {
    // Если нет выбранных фильтров, показываем все
    if (Object.keys(selectedFilters).length === 0) {
      return true;
    }

    // Проверяем каждый выбранный фильтр
    for (const [filterIdStr, filterValue] of Object.entries(selectedFilters)) {
      const filterId = parseInt(filterIdStr);
      const filter = availableFilters.find(f => f.id === filterId);
      
      if (!filter) continue;

      const auctionValue = auction.filter_values?.[filterId];

      // Чекбоксы - хотя бы одно значение должно совпадать
      if (filter.type === 'checkbox') {
        if (!filterValue || filterValue.length === 0) continue;
        
        if (!auctionValue || !Array.isArray(auctionValue)) {
          return false; // У лота нет значений этого фильтра
        }

        // Проверяем, есть ли пересечение выбранных значений с значениями лота
        const hasMatch = filterValue.some((selectedVal: string) => 
          auctionValue.includes(selectedVal)
        );
        
        if (!hasMatch) {
          return false;
        }
      }

      // Диапазон - проверяем min/max
      if (filter.type === 'range') {
        const min = filterValue?.min ? parseFloat(filterValue.min) : null;
        const max = filterValue?.max ? parseFloat(filterValue.max) : null;

        if (min === null && max === null) continue;

        const auctionMin = auctionValue?.min ? parseFloat(auctionValue.min) : null;
        const auctionMax = auctionValue?.max ? parseFloat(auctionValue.max) : null;

        // Если у лота нет значений, пропускаем
        if (auctionMin === null && auctionMax === null) {
          return false;
        }

        // Проверяем пересечение диапазонов
        if (min !== null && auctionMax !== null && auctionMax < min) {
          return false;
        }
        if (max !== null && auctionMin !== null && auctionMin > max) {
          return false;
        }
      }

      // Текст - поиск подстроки (регистронезависимый)
      if (filter.type === 'text') {
        if (!filterValue || filterValue.trim() === '') continue;

        if (!auctionValue || typeof auctionValue !== 'string') {
          return false;
        }

        const searchLower = filterValue.toLowerCase();
        const valueLower = auctionValue.toLowerCase();
        
        if (!valueLower.includes(searchLower)) {
          return false;
        }
      }
    }

    return true;
  };

  // Сортировка аукционов на клиенте
  const sortedAuctions = [...auctions]
    .filter(matchesFilters) // Сначала фильтруем
    .sort((a, b) => {
      if (sortBy === 'price-low') {
        return parsePrice(a.starting_price) - parsePrice(b.starting_price);
      } else if (sortBy === 'price-high') {
        return parsePrice(b.starting_price) - parsePrice(a.starting_price);
      } else {
        // relevance - по id (как загружено из БД)
        return a.id - b.id;
      }
    });

  // Логируем результат фильтрации

  // Загрузка фильтров для категории
  const fetchFilters = async (categoryParam: string | null) => {
    if (!categoryParam) {
      setAvailableFilters([]);
      return;
    }

    try {
      const response = await fetch(`/api/filters?category=${encodeURIComponent(categoryParam)}`);
      const data = await response.json();
      setAvailableFilters(data.filters || []);
    } catch (error) {
      console.error('Ошибка при загрузке фильтров:', error);
      setAvailableFilters([]);
    }
  };

  useEffect(() => {
    // Загружаем аукционы при изменении категории
    setLoading(true);
    fetchAuctions(0, category); // сортировка применяется на клиенте, см. отсортированный список ниже
    fetchFilters(category); // Загружаем фильтры
  }, [category]);

  // Логирование при изменении выбранных фильтров
  useEffect(() => {
  }, [selectedFilters]);

  // Закрытие панели сортировки при клике вне её
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSortOpen && !target.closest('.sort-panel-container')) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchAuctions(auctions.length, category);
    // После загрузки новые элементы автоматически отсортируются через sortedAuctions
  };

  // Обработчик подписки на рассылку
  const handleSubscribe = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email.trim() || isSubscribing) return;

    setIsSubscribing(true);
    setSubscriptionMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubscriptionMessage(data.message);
        if (!data.alreadySubscribed) {
          setEmail(''); // Очищаем поле только при успешной новой подписке
        }
      } else {
        setSubscriptionMessage(data.error || 'Произошла ошибка');
      }
    } catch (error) {
      setSubscriptionMessage('Произошла ошибка при отправке запроса');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Функция для определения размера карточки на основе индекса
  const getCardSize = (index: number): 'normal' | 'large' => {
    // Паттерн: 6 обычных, 2 больших, повторяется
    const patternIndex = index % 8; // 6 + 2 = 8
    
    if (patternIndex < 6) {
      // Первые 6 - обычные
      return 'normal';
    } else {
      // Следующие 2 - большие
      return 'large';
    }
  };

  // Функция для группировки аукционов по паттерну
  const groupAuctions = () => {
    const groups: { items: Auction[]; layout: 'grid' | 'two-large' }[] = [];
    
    if (sortedAuctions.length === 0) return groups;

    let i = 0;
    while (i < sortedAuctions.length) {
      const patternIndex = i % 8;
      
      if (patternIndex < 6) {
        // Первые 6 - обычная сетка
        const endIndex = Math.min(i + (6 - patternIndex), sortedAuctions.length);
        groups.push({
          items: sortedAuctions.slice(i, endIndex),
          layout: 'grid'
        });
        i = endIndex;
      } else {
        // Следующие 2 - большие
        const endIndex = Math.min(i + (8 - patternIndex), sortedAuctions.length);
        groups.push({
          items: sortedAuctions.slice(i, endIndex),
          layout: 'two-large'
        });
        i = endIndex;
      }
    }

    return groups;
  };

  // Получаем название категории
  const getCategoryName = () => {
    const categoryNames: { [key: string]: string } = {
      'painting': 'Живопись',
      'watches': 'Часы',
      'furniture': 'Мебель',
      'porcelain': 'Фарфор',
      'cars': 'Автомобили',
      'jewelry': 'Ювелирные изделия',
      'wine': 'Вино',
      'carpets': 'Ковры',
      'sculptures': 'Скульптуры',
      'books': 'Книги',
      'instruments': 'Музыкальные инструменты',
      'japanese-art': 'Японское искусство',
      'coins': 'Монеты',
      'bags': 'Сумки и аксессуары',
      'contemporary': 'Современное искусство',
      'weapons': 'Оружие',
      'minerals': 'Минералы',
      'maps': 'Карты',
    };
    return category ? categoryNames[category] || 'Аукционы' : 'Аукционы';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ fontFamily: 'var(--font-open-sans)' }}>
          Загрузка...
        </p>
      </div>
    );
  }

  const auctionGroups = groupAuctions();

  return (
    <div className="w-full bg-white">
      {/* Аккуратный текст по центру - как на главной странице */}
      <section className="w-full bg-white pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <p 
              className="text-sm sm:text-base md:text-lg leading-relaxed text-center"
              style={{
                fontFamily: 'var(--font-open-sans)',
                color: 'var(--color-classic-black)',
                fontWeight: 400,
                letterSpacing: '0.05em',
                lineHeight: '1.6',
              }}
            >
              {getCategoryName()}
            </p>
          </div>
        </div>
      </section>

      {/* Блок с текстом и панелькой в стиле Loro Piana */}
      <section className="w-full bg-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Текст описания */}
            <div className="text-center mb-6">
              <p
                className={`text-sm sm:text-base leading-relaxed ${isTextExpanded ? '' : 'line-clamp-3'}`}
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#5c1a1a',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: '1.6',
                }}
              >
                Для нового сезона Hwang&apos;s наполняет коллекцию элегантной, живой легкостью, которая передается только через чувственность. От редких произведений искусства до эксклюзивных часов, богатые текстуры интерпретируются в непринужденных пропорциях и фирменных формах Дома, чтобы создать утонченный силуэт премиальной коллекции. Палитра следует за этим с земляными оттенками, вневременными нейтральными тонами и акцентами оживляющих зеленых тонов, чтобы создать подходящую связь между готовыми работами и аксессуарами.
              </p>
              <button
                onClick={() => setIsTextExpanded(!isTextExpanded)}
                className="mt-4 text-sm"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#5c1a1a',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                {isTextExpanded ? 'Свернуть' : 'Читать далее'}
              </button>
            </div>

            {/* Горизонтальная линия */}
            <div className="border-b border-gray-200 mb-6"></div>

            {/* Панелька с информацией */}
            <div className="flex items-center justify-between text-sm">
              {/* Слева - количество проектов */}
              <div
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#5c1a1a',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                }}
              >
                Проекты ({sortedAuctions.length})
              </div>

              {/* По центру - Фильтры */}
              <button
                onClick={() => {
                  if (!isFiltersOpen) {
                    setIsFiltersOpen(true);
                    // Небольшая задержка для применения начального состояния перед анимацией
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        setIsFiltersAnimating(true);
                      });
                    });
                  } else {
                    setIsFiltersAnimating(false);
                    setTimeout(() => setIsFiltersOpen(false), 400);
                  }
                }}
                className="flex items-center gap-2 cursor-pointer filter-button"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#5c1a1a',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="18" x2="20" y2="18"></line>
                  <circle cx="8" cy="6" r="1.5" fill="currentColor"></circle>
                  <circle cx="16" cy="12" r="1.5" fill="currentColor"></circle>
                  <circle cx="12" cy="18" r="1.5" fill="currentColor"></circle>
                </svg>
                <span>Фильтры</span>
              </button>

              {/* Справа - Сортировка */}
              <div className="relative sort-panel-container">
                <button
                onClick={() => {
                  if (!isSortOpen) {
                    setIsSortOpen(true);
                    // Небольшая задержка для применения начального состояния перед анимацией
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        setIsSortAnimating(true);
                      });
                    });
                  } else {
                    setIsSortAnimating(false);
                    setTimeout(() => setIsSortOpen(false), 300);
                  }
                }}
                  className="flex items-center gap-2 cursor-pointer filter-button"
                  style={{
                    fontFamily: 'var(--font-open-sans)',
                    color: '#5c1a1a',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  <span>Сортировать</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ 
                      transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Панель сортировки */}
                {isSortOpen && (
                  <div 
                    className={`absolute right-0 top-full mt-2 bg-white border border-gray-200 shadow-lg z-50 sort-panel ${isSortAnimating ? 'sort-panel-enter' : ''}`}
                    style={{ minWidth: '200px' }}
                  >
                    {[
                      { value: 'relevance', label: 'Релевантность' },
                      { value: 'price-low', label: 'Цена - от низкой к высокой' },
                      { value: 'price-high', label: 'Цена - от высокой к низкой' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortAnimating(false);
                          setTimeout(() => setIsSortOpen(false), 300);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-all duration-200"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          color: sortBy === option.value ? '#5c1a1a' : '#000000',
                          fontSize: '14px',
                          letterSpacing: '0.02em',
                          background: 'none',
                          border: 'none',
                          transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                      >
                        <span>{option.label}</span>
                        {sortBy === option.value && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5c1a1a" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Горизонтальная линия */}
            <div className="border-b border-gray-200 mt-6"></div>
          </div>
        </div>
      </section>

      {/* Боковая панель фильтров */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Затемнение */}
          <div 
            className={`flex-1 bg-black/20 filters-panel-overlay ${isFiltersAnimating ? 'filters-panel-overlay-enter' : ''}`}
            onClick={() => {
              if (isFiltersAnimating) {
                setIsFiltersAnimating(false);
                setTimeout(() => setIsFiltersOpen(false), 400);
              }
            }}
          ></div>
          
          {/* Панель фильтров */}
          <div 
            className={`w-full max-w-md bg-white overflow-y-auto filters-panel ${isFiltersAnimating ? 'filters-panel-enter' : ''}`}
            style={{ maxHeight: '100vh' }}
          >
            <div className="p-6">
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: 'var(--font-playfair-display)',
                    color: '#000000',
                    fontWeight: 400,
                  }}
                >
                  Фильтр
                </h2>
                <button
                  onClick={() => {
                    if (isFiltersAnimating) {
                      setIsFiltersAnimating(false);
                      setTimeout(() => setIsFiltersOpen(false), 400);
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Количество проектов и Reset */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <p
                  className="text-sm"
                  style={{
                    fontFamily: 'var(--font-open-sans)',
                    color: '#000000',
                    fontWeight: 400,
                  }}
                >
                  {sortedAuctions.length} Проектов доступно
                </p>
                <button
                  onClick={() => {
                    setSelectedSubcategories(new Set());
                    setSelectedFilters({});
                    setExpandedFilters(new Set());
                  }}
                  className="text-sm transition-all duration-200 hover:opacity-70"
                  style={{
                    fontFamily: 'var(--font-open-sans)',
                    color: '#000000',
                    fontWeight: 400,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  Сбросить
                </button>
              </div>

              {/* Категория - Подкатегории */}
              {availableSubcategories.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedFilters);
                      if (newExpanded.has('subcategory')) {
                        newExpanded.delete('subcategory');
                      } else {
                        newExpanded.add('subcategory');
                      }
                      setExpandedFilters(newExpanded);
                    }}
                    className="w-full flex items-center justify-between py-3 border-b border-gray-200 filter-button"
                    style={{
                      fontFamily: 'var(--font-playfair-display)',
                      color: '#000000',
                      fontWeight: 400,
                      fontSize: '16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Подкатегория</span>
                    <span 
                      className="filter-expand-icon"
                      style={{ 
                        fontSize: '20px', 
                        color: '#5c1a1a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        width: '20px',
                        height: '20px',
                        lineHeight: '1',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          display: 'inline-block',
                          opacity: expandedFilters.has('subcategory') ? 0 : 1,
                          transform: expandedFilters.has('subcategory') ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
                          transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          pointerEvents: expandedFilters.has('subcategory') ? 'none' : 'auto',
                        }}
                      >
                        +
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          display: 'inline-block',
                          opacity: expandedFilters.has('subcategory') ? 1 : 0,
                          transform: expandedFilters.has('subcategory') ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                          transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          pointerEvents: expandedFilters.has('subcategory') ? 'auto' : 'none',
                        }}
                      >
                        −
                      </span>
                    </span>
                  </button>

                  <div 
                    className="subcategories-list"
                    style={{
                      maxHeight: expandedFilters.has('subcategory') ? '1000px' : '0',
                      opacity: expandedFilters.has('subcategory') ? 1 : 0,
                      paddingTop: expandedFilters.has('subcategory') ? '1rem' : '0',
                      paddingBottom: expandedFilters.has('subcategory') ? '0' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    <div className="space-y-2">
                      {availableSubcategories.map((subcat) => (
                        <label
                          key={subcat}
                          className="flex items-center gap-3 py-2 cursor-pointer filter-checkbox-label"
                          style={{
                            opacity: expandedFilters.has('subcategory') ? 1 : 0,
                            transform: expandedFilters.has('subcategory') ? 'translateY(0)' : 'translateY(-10px)',
                            transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s, transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubcategories.has(subcat)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedSubcategories);
                              if (e.target.checked) {
                                newSelected.add(subcat);
                              } else {
                                newSelected.delete(subcat);
                              }
                              setSelectedSubcategories(newSelected);
                            }}
                            className="w-4 h-4 border-[#5c1a1a] text-[#5c1a1a] focus:ring-[#5c1a1a]"
                            style={{ accentColor: '#5c1a1a' }}
                          />
                          <span
                            className="text-sm transition-colors duration-200"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: '#000000',
                              fontWeight: 400,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#5c1a1a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#000000';
                            }}
                          >
                            {subcat}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Новые фильтры */}
              {availableFilters.map((filter) => (
                <div key={filter.id} className="mb-6">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedFilters);
                      if (newExpanded.has(`filter-${filter.id}`)) {
                        newExpanded.delete(`filter-${filter.id}`);
                      } else {
                        newExpanded.add(`filter-${filter.id}`);
                      }
                      setExpandedFilters(newExpanded);
                    }}
                    className="w-full flex items-center justify-between py-3 border-b border-gray-200 filter-button"
                    style={{
                      fontFamily: 'var(--font-playfair-display)',
                      color: '#000000',
                      fontWeight: 400,
                      fontSize: '16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{filter.name}</span>
                    <span 
                      className="filter-expand-icon"
                      style={{ 
                        fontSize: '20px', 
                        color: '#5c1a1a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        width: '20px',
                        height: '20px',
                        lineHeight: '1',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          display: 'inline-block',
                          opacity: expandedFilters.has(`filter-${filter.id}`) ? 0 : 1,
                          transform: expandedFilters.has(`filter-${filter.id}`) ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
                          transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          pointerEvents: expandedFilters.has(`filter-${filter.id}`) ? 'none' : 'auto',
                        }}
                      >
                        +
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          display: 'inline-block',
                          opacity: expandedFilters.has(`filter-${filter.id}`) ? 1 : 0,
                          transform: expandedFilters.has(`filter-${filter.id}`) ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                          transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          pointerEvents: expandedFilters.has(`filter-${filter.id}`) ? 'auto' : 'none',
                        }}
                      >
                        −
                      </span>
                    </span>
                  </button>

                  <div 
                    className="filter-content"
                    style={{
                      maxHeight: expandedFilters.has(`filter-${filter.id}`) ? '1000px' : '0',
                      opacity: expandedFilters.has(`filter-${filter.id}`) ? 1 : 0,
                      paddingTop: expandedFilters.has(`filter-${filter.id}`) ? '1rem' : '0',
                      paddingBottom: expandedFilters.has(`filter-${filter.id}`) ? '0' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), padding 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    {/* Чекбоксы */}
                    {filter.type === 'checkbox' && filter.options && (
                      <div className="space-y-2">
                        {filter.options.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center gap-3 py-2 cursor-pointer filter-checkbox-label"
                            style={{
                              opacity: expandedFilters.has(`filter-${filter.id}`) ? 1 : 0,
                              transform: expandedFilters.has(`filter-${filter.id}`) ? 'translateY(0)' : 'translateY(-10px)',
                              transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s, transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFilters[filter.id]?.includes(option.value) || false}
                              onChange={(e) => {
                                const currentValues = selectedFilters[filter.id] || [];
                                const newValues = e.target.checked
                                  ? [...currentValues, option.value]
                                  : currentValues.filter((v: string) => v !== option.value);
                                setSelectedFilters({
                                  ...selectedFilters,
                                  [filter.id]: newValues,
                                });
                              }}
                              className="w-4 h-4 border-[#5c1a1a] text-[#5c1a1a] focus:ring-[#5c1a1a]"
                              style={{ accentColor: '#5c1a1a' }}
                            />
                            <span
                              className="text-sm transition-colors duration-200"
                              style={{
                                fontFamily: 'var(--font-open-sans)',
                                color: '#000000',
                                fontWeight: 400,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#5c1a1a';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#000000';
                              }}
                            >
                              {option.value}
                            </span>
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
                          value={selectedFilters[filter.id]?.min || ''}
                          onChange={(e) => {
                            const currentValues = selectedFilters[filter.id] || {};
                            setSelectedFilters({
                              ...selectedFilters,
                              [filter.id]: {
                                ...currentValues,
                                min: e.target.value,
                              },
                            });
                          }}
                          className="w-24 px-2 py-1 border text-sm"
                        />
                        <span className="text-sm">—</span>
                        <input
                          type="number"
                          placeholder="До"
                          value={selectedFilters[filter.id]?.max || ''}
                          onChange={(e) => {
                            const currentValues = selectedFilters[filter.id] || {};
                            setSelectedFilters({
                              ...selectedFilters,
                              [filter.id]: {
                                ...currentValues,
                                max: e.target.value,
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
                        placeholder="Введите значение"
                        value={selectedFilters[filter.id] || ''}
                        onChange={(e) => {
                          setSelectedFilters({
                            ...selectedFilters,
                            [filter.id]: e.target.value,
                          });
                        }}
                        className="w-full px-3 py-2 border text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка внизу */}
            <div className="sticky bottom-0 p-6 bg-white border-t border-gray-200">
              <button
                onClick={() => {
                  if (isFiltersAnimating) {
                    setIsFiltersAnimating(false);
                    setTimeout(() => setIsFiltersOpen(false), 400);
                  }
                  // Здесь можно применить фильтры
                }}
                className="w-full py-4 text-center show-products-button"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#ffffff',
                  backgroundColor: '#5c1a1a',
                  fontWeight: 400,
                  fontSize: '14px',
                  letterSpacing: '0.02em',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Показать {sortedAuctions.length} Проектов
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Сетка аукционов */}
      <section className="w-full bg-white pb-12 sm:pb-16 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto space-y-8 sm:space-y-10 md:space-y-12">
            {auctionGroups.map((group, groupIndex) => {
              if (group.layout === 'grid') {
                // Сетка из обычных карточек (по 3 в ряд, всего 6 карточек = 2 ряда)
                return (
                  <div
                    key={`grid-${groupIndex}`}
                    className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10"
                  >
                    {group.items.map((auction) => (
                      <AuctionCard
                        key={auction.id}
                        id={auction.id.toString()}
                        name={auction.name}
                        additionalInfo={auction.additional_info || undefined}
                        startingPrice={auction.starting_price}
                        auctionDates={auction.auction_dates}
                        images={auction.images || []}
                      />
                    ))}
                  </div>
                );
              } else if (group.layout === 'two-large') {
                // Две большие карточки - каждая занимает половину ширины
                return (
                  <div
                    key={`two-large-${groupIndex}`}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10"
                  >
                    {group.items.map((auction) => (
                      <div key={auction.id} className="col-span-1">
                        <AuctionCard
                          id={auction.id.toString()}
                          name={auction.name}
                          additionalInfo={auction.additional_info || undefined}
                          startingPrice={auction.starting_price}
                          auctionDates={auction.auction_dates}
                          images={auction.images || []}
                        />
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Кнопка "Посмотреть еще" */}
          {hasMore && (
            <div className="flex justify-center mt-12 sm:mt-16 md:mt-20">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm sm:text-base relative inline-block cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: 'var(--font-playfair-display)',
                  color: '#000000',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                }}
              >
                {/* Дефисы по бокам - уменьшаются, край у текста остается на месте */}
                <span className="inline-block origin-right scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out">– </span>
                <span>
                  {loadingMore 
                    ? 'Загрузка...' 
                    : `Посмотреть еще (${totalCount - auctions.length})`
                  }
                </span>
                <span className="inline-block origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out"> –</span>
                
                {/* Линия под текстом - появляется при наведении на текст */}
                <span 
                  className="absolute bottom-0 left-0 right-0 h-px bg-black origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-in-out"
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Футер - Премиум стиль */}
      <footer className="w-full flex flex-col items-center">
        {/* Верхняя часть - темный фон, на всю ширину на мобильных */}
        <div className="w-full md:w-[80%] py-10 sm:py-12 md:py-14" style={{ backgroundColor: '#5c1a1a' }}>
            <div className="container mx-auto px-0 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 sm:gap-10 md:gap-12">
                  {/* Подписка на рассылку */}
                  <div className="md:col-span-2 px-4 md:px-0">
                    <h3
                      className="text-xs sm:text-sm mb-3 sm:mb-4 text-white"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                      }}
                    >
                      Подпишитесь на нашу рассылку
                    </h3>
                    <p
                      className="text-xs mb-6 sm:mb-8 leading-relaxed text-white/80"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        fontWeight: 400,
                        letterSpacing: '0.02em',
                        lineHeight: '1.6',
                      }}
                    >
                      Получайте нашу рассылку и узнавайте о наших коллекциях, аукционах и последних новостях.
                    </p>
                    <form onSubmit={handleSubscribe} className="mb-4">
                      <div className="flex items-center gap-2 border-b border-white/30 pb-2">
                        <input
                          type="email"
                          placeholder="Ваш email адрес"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isSubscribing}
                          className="flex-1 bg-transparent text-white placeholder:text-white/60 focus:outline-none text-xs"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                          }}
                          required
                        />
                        <button
                          type="submit"
                          disabled={isSubscribing || !email.trim()}
                          className="text-white text-xs cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                          }}
                        >
                          →
                        </button>
                      </div>
                    </form>
                    {subscriptionMessage && (
                      <p
                        className="text-xs mb-4 text-white/90"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          letterSpacing: '0.02em',
                          lineHeight: '1.4',
                        }}
                      >
                        {subscriptionMessage}
                      </p>
                    )}
                    <p
                      className="text-xs text-white/70"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        letterSpacing: '0.02em',
                        lineHeight: '1.4',
                      }}
                    >
                      Я подтверждаю, что мой email адрес будет обработан в соответствии с положениями Политики конфиденциальности.
                    </p>
                  </div>

                  {/* Свяжитесь с нами */}
                  <div className="px-4 md:px-0">
                    <button
                      onClick={() => toggleFooterSection('contact')}
                      className="md:pointer-events-none w-full flex items-center justify-between py-3 md:py-0 border-b border-white/20 md:border-0 mb-4 sm:mb-5"
                    >
                      <h4
                        className="text-xs uppercase tracking-wider text-white"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          fontWeight: 400,
                          letterSpacing: '0.1em',
                        }}
                      >
                        СВЯЖИТЕСЬ С НАМИ
                      </h4>
                      <span 
                        className="md:hidden text-white/80 transition-transform duration-300 ease-in-out"
                        style={{
                          transform: openFooterSections['contact'] ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}
                      >
                        ›
                      </span>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        openFooterSections['contact'] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
                      }`}
                    >
                      <ul className="space-y-2 sm:space-y-3">
                      {[
                        { label: 'Контакты', action: 'phone' },
                        { label: 'FAQ', href: '/faq' }
                      ].map((item) => (
                        <li key={item.label}>
                          {item.action === 'phone' ? (
                            <button
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('openPhonePanel'));
                              }}
                              className="text-xs text-white/80 relative inline-block group"
                              style={{
                                fontFamily: 'var(--font-open-sans)',
                                letterSpacing: '0.02em',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                              }}
                            >
                              {item.label}
                              <span className="absolute bottom-0 left-0 right-0 h-px bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                            </button>
                          ) : (
                            <Link
                              href={item.href || `/${item.label.toLowerCase()}`}
                              className="text-xs text-white/80 relative inline-block group"
                              style={{
                                fontFamily: 'var(--font-open-sans)',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {item.label}
                              <span className="absolute bottom-0 left-0 right-0 h-px bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                            </Link>
                          )}
                        </li>
                      ))}
                      </ul>
                    </div>
                  </div>

                  {/* Социальные сети */}
                  <div className="px-4 md:px-0">
                    <button
                      onClick={() => toggleFooterSection('social')}
                      className="md:pointer-events-none w-full flex items-center justify-between py-3 md:py-0 border-b border-white/20 md:border-0 mb-4 sm:mb-5"
                    >
                      <h4
                        className="text-xs uppercase tracking-wider text-white"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          fontWeight: 400,
                          letterSpacing: '0.1em',
                        }}
                      >
                        СОЦИАЛЬНЫЕ СЕТИ
                      </h4>
                      <span 
                        className="md:hidden text-white/80 transition-transform duration-300 ease-in-out"
                        style={{
                          transform: openFooterSections['social'] ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}
                      >
                        ›
                      </span>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        openFooterSections['social'] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
                      }`}
                    >
                      <ul className="space-y-2 sm:space-y-3">
                      {['Instagram', 'Telegram', 'WhatsApp'].map((social) => (
                        <li key={social}>
                          <Link
                            href={`/${social.toLowerCase()}`}
                            className="text-xs text-white/80 relative inline-block group"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {social}
                            <span className="absolute bottom-0 left-0 right-0 h-px bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                          </Link>
                        </li>
                      ))}
                      </ul>
                    </div>
                  </div>

                  {/* Правовая информация */}
                  <div className="px-4 md:px-0">
                    <button
                      onClick={() => toggleFooterSection('legal')}
                      className="md:pointer-events-none w-full flex items-center justify-between py-3 md:py-0 border-b border-white/20 md:border-0 mb-4 sm:mb-5"
                    >
                      <h4
                        className="text-xs uppercase tracking-wider text-white"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          fontWeight: 400,
                          letterSpacing: '0.1em',
                        }}
                      >
                        ПРАВОВАЯ ИНФОРМАЦИЯ
                      </h4>
                      <span 
                        className="md:hidden text-white/80 transition-transform duration-300 ease-in-out"
                        style={{
                          transform: openFooterSections['legal'] ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}
                      >
                        ›
                      </span>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        openFooterSections['legal'] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-96 md:opacity-100'
                      }`}
                    >
                      <ul className="space-y-2 sm:space-y-3">
                      {[
                        { label: 'Политика конфиденциальности', href: '/privacy-policy' },
                        { label: 'Условия использования', href: '/terms-of-use' },
                        { label: 'Cookies', href: '/cookies' }
                      ].map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="text-xs text-white/80 relative inline-block group"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              letterSpacing: '0.02em',
                            }}
                          >
                            {item.label}
                            <span className="absolute bottom-0 left-0 right-0 h-px bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                          </Link>
                        </li>
                      ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Нижняя часть - белый фон */}
        <div className="w-full md:w-[80%] py-6 sm:py-8 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
              {/* Логотип по центру */}
              <div className="flex justify-center items-center mb-4 sm:mb-5">
                <img 
                  src="/logog.png" 
                  alt="HWANG'S" 
                  className="h-8 sm:h-10 w-auto"
                />
              </div>
                
                {/* Информация под логотипом */}
                <div className="flex justify-center">
                  <p
                    className="text-xs text-center"
                    style={{
                      fontFamily: 'var(--font-open-sans)',
                      letterSpacing: '0.02em',
                      color: '#666666',
                    }}
                  >
                    Hwang&apos;s S.P.A 2025 VAT Number 01611400027 | Hwang&apos;s Official Online Store
                  </p>
                </div>
              </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

// Страница статическая, а useSearchParams вне границы Suspense роняет пререндер
export default function AuctionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-500 tracking-widest uppercase text-sm">Загрузка каталога</p>
        </div>
      }
    >
      <AuctionsView />
    </Suspense>
  );
}

