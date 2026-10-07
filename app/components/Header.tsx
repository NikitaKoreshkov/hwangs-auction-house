'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ProductInfo {
  productName: string;
  productPrice: string;
  productId: number;
  productUrl: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

interface SearchResult {
  id: number;
  name: string;
  starting_price: string;
  images: string[];
}

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [panelType, setPanelType] = useState<'search' | 'phone' | 'auctions'>('search');
  const [searchValue, setSearchValue] = useState('');
  const [headerHeight, setHeaderHeight] = useState(120);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(0); // Индекс выбранной категории
  const [clickedCategory, setClickedCategory] = useState(0); // Последняя категория, на которую кликнули
  const [isImageChanging, setIsImageChanging] = useState(false); // Состояние для анимации смены изображения
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null); // Информация о товаре
  const [categories, setCategories] = useState<Category[]>([]); // Категории из БД
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // Результаты поиска
  const [isSearching, setIsSearching] = useState(false); // Идет ли поиск
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Состояние мобильного меню
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { label: 'Аукционы', href: '/auctions', isPanel: true },
    { label: 'О нас', href: '/about' },
    { label: 'Документы', href: '/documents' },
  ];

  // Загружаем категории из БД
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    };
    
    loadCategories();
  }, []);

  // Поиск лотов в реальном времени
  useEffect(() => {
    const searchAuctions = async () => {
      if (!searchValue.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const response = await fetch('/api/auctions');
        const data = await response.json();
        
        // Фильтруем по названию на клиенте
        const filtered = (data.auctions || [])
          .filter((auction: SearchResult) => 
            auction.name.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(0, 20); // Ограничиваем 20 результатами
        
        setSearchResults(filtered);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce - ждем 300ms после последнего ввода
    const timeoutId = setTimeout(() => {
      searchAuctions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  // Преобразуем категории в формат для отображения
  const auctionCategories = categories.map(cat => ({
    label: cat.name,
    href: `/auctions?category=${cat.slug}`,
    image: cat.image_url,
    category: cat.slug,
  }));

  const openSearch = () => {
    // Если уже открыта панель поиска, просто закрываем её
    if (isSearchOpen && panelType === 'search') {
      closeAllPanels();
      return;
    }
    setPanelType('search');
    setIsSearchOpen(true);
    setIsMobileMenuOpen(false); // Закрываем мобильное меню при открытии поиска
  };

  const openPhone = useCallback(() => {
    // Если уже открыта панель телефона, просто закрываем её
    if (isSearchOpen && panelType === 'phone') {
      closeAllPanels();
      return;
    }
    setPanelType('phone');
    setIsSearchOpen(true);
    setIsMobileMenuOpen(false); // Закрываем мобильное меню при открытии телефона
    setProductInfo(null); // Очищаем информацию о товаре при обычном открытии
  }, [isSearchOpen, panelType]);

  const openAuctions = useCallback(() => {
    // Если уже открыта панель аукционов, просто закрываем её
    if (isSearchOpen && panelType === 'auctions') {
      closeAllPanels();
      return;
    }
    setPanelType('auctions');
    setIsSearchOpen(true);
    setIsMobileMenuOpen(false); // Закрываем мобильное меню при открытии аукционов
  }, [isSearchOpen, panelType]);

  const closeAllPanels = () => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchValue('');
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    } else {
      // Закрываем другие панели при открытии бургера
      setIsSearchOpen(false);
      setSearchValue('');
      setIsMobileMenuOpen(true);
    }
  };

  // Слушаем кастомное событие для открытия панели телефона из других компонентов
  useEffect(() => {
    const handleOpenPhone = () => {
      openPhone();
    };

    const handleOpenPhoneWithProduct = (e: Event) => {
      const customEvent = e as CustomEvent<ProductInfo>;
      setProductInfo(customEvent.detail);
      setPanelType('phone');
      setIsSearchOpen(true);
    };

    const handleOpenSearch = () => {
      openSearch();
    };

    window.addEventListener('openPhonePanel', handleOpenPhone);
    window.addEventListener('openPhonePanelWithProduct', handleOpenPhoneWithProduct);
    window.addEventListener('openSearchPanel', handleOpenSearch);
    return () => {
      window.removeEventListener('openPhonePanel', handleOpenPhone);
      window.removeEventListener('openPhonePanelWithProduct', handleOpenPhoneWithProduct);
      window.removeEventListener('openSearchPanel', handleOpenSearch);
    };
  }, [openPhone]);

  // Вычисление высоты хедера
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Фокус на поле ввода при открытии панели
  useEffect(() => {
    if (isSearchOpen && panelType === 'search') {
      setTimeout(() => {
        // На десктопе фокус на инпут в хедере
        if (headerSearchInputRef.current && window.innerWidth >= 768) {
          headerSearchInputRef.current?.focus();
        }
        // На мобильных фокус на мобильный инпут
        if (mobileSearchInputRef.current && window.innerWidth < 768) {
          mobileSearchInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isSearchOpen, panelType]);

  // Сохранение фокуса на мобильном инпуте при изменении результатов поиска
  useEffect(() => {
    if (isSearchOpen && panelType === 'search' && window.innerWidth < 768) {
      // Небольшая задержка, чтобы убедиться, что DOM обновился
      setTimeout(() => {
        if (mobileSearchInputRef.current && document.activeElement !== mobileSearchInputRef.current) {
          mobileSearchInputRef.current.focus();
        }
      }, 50);
    }
  }, [searchResults, isSearchOpen, panelType]);

  // Закрытие поиска и мобильного меню при нажатии Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllPanels();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Очищаем поиск при закрытии панели
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchValue('');
    }
  }, [isSearchOpen]);

  // Блокировка скролла при открытой панели или мобильном меню
  useEffect(() => {
    if (isSearchOpen || isMobileMenuOpen) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY;
      
      // Блокируем скролл
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Восстанавливаем скролл
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isSearchOpen, isMobileMenuOpen]);

  // Отслеживание скролла для скрытия/показа хедера
  // ВРЕМЕННО ОТКЛЮЧЕНО
  // useEffect(() => {
  //   const handleScroll = () => {
  //     // Не скрываем хеддер, если открыта панель поиска/звонка
  //     if (isSearchOpen) {
  //       return;
  //     }

  //     const currentScrollY = window.scrollY;
  //     const scrollThreshold = 10; // Минимальный порог для срабатывания

  //     // Если скроллим вниз и хеддер виден
  //     if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
  //       setIsHeaderVisible(false);
  //     }
  //     // Если скроллим вверх
  //     else if (currentScrollY < lastScrollY) {
  //       setIsHeaderVisible(true);
  //     }
  //     // Если в самом верху страницы - показываем хеддер
  //     else if (currentScrollY <= scrollThreshold) {
  //       setIsHeaderVisible(true);
  //     }

  //     setLastScrollY(currentScrollY);
  //   };

  //   // Используем requestAnimationFrame для плавности
  //   let ticking = false;
  //   const onScroll = () => {
  //     if (!ticking) {
  //       window.requestAnimationFrame(() => {
  //         handleScroll();
  //         ticking = false;
  //       });
  //       ticking = true;
  //     }
  //   };

  //   window.addEventListener('scroll', onScroll, { passive: true });
  //   return () => window.removeEventListener('scroll', onScroll);
  // }, [lastScrollY, isSearchOpen]);

  return (
    <>
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 header-scroll"
        style={{
          transform: isHeaderVisible ? 'translateY(0) translateZ(0)' : 'translateY(-100%) translateZ(0)',
          WebkitTransform: isHeaderVisible ? 'translateY(0) translateZ(0)' : 'translateY(-100%) translateZ(0)',
          willChange: 'transform',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: 'white',
          // backdropFilter: 'blur(10px) saturate(180%)', // ВРЕМЕННО ОТКЛЮЧЕНО
          // WebkitBackdropFilter: 'blur(10px) saturate(180%)', // ВРЕМЕННО ОТКЛЮЧЕНО
          borderBottom: 'none',
          boxShadow: 'none',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Верхняя часть - лого и текст по центру */}
          <div className="flex flex-col items-center justify-center py-2 sm:py-3">
            {/* Логотип */}
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault();
                setIsSearchOpen(false);
                setSearchValue('');
                window.location.href = '/';
              }}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src="/logog.png" 
                alt="HWANG'S" 
                className="h-8 sm:h-10 md:h-12 w-auto brightness-0"
              />
            </a>
          </div>

          {/* Нижняя часть - иконки слева и справа, ссылки по центру или инпут при поиске */}
          <div className="flex items-center justify-between pb-2 sm:pb-3 pt-2 sm:pt-3">
            {/* Мобильная версия: иконки поиска и телефона слева, или крестик при открытой панели */}
            <div className="relative flex items-center gap-2 md:hidden" style={{ minWidth: '88px', height: '40px' }}>
              {/* Иконка поиска - всегда в DOM, анимируется */}
              <button
                onClick={openSearch}
                className="mobile-icon-button p-2 hover:opacity-70 transition-opacity"
                aria-label="Поиск"
                style={{
                  opacity: isSearchOpen ? 0 : 1,
                  transform: isSearchOpen 
                    ? 'translateX(20px) scale(0.3) rotate(-180deg)' 
                    : 'translateX(0) scale(1) rotate(0deg)',
                  pointerEvents: isSearchOpen ? 'none' : 'auto',
                  position: 'absolute',
                  left: 0,
                  transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ color: 'var(--color-classic-black)' }}
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
              
              {/* Иконка телефона - всегда в DOM, анимируется */}
              <button
                onClick={openPhone}
                className="mobile-icon-button p-2 hover:opacity-70 transition-opacity"
                aria-label="Заказать звонок"
                style={{
                  opacity: isSearchOpen ? 0 : 1,
                  transform: isSearchOpen 
                    ? 'translateX(-20px) scale(0.3) rotate(180deg)' 
                    : 'translateX(0) scale(1) rotate(0deg)',
                  pointerEvents: isSearchOpen ? 'none' : 'auto',
                  position: 'absolute',
                  left: '40px',
                  transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ color: 'var(--color-classic-black)' }}
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
              
              {/* Крестик для закрытия - всегда в DOM, анимируется */}
              <button
                onClick={closeAllPanels}
                className="mobile-icon-button p-2 hover:opacity-70 transition-opacity"
                aria-label="Закрыть"
                style={{
                  opacity: isSearchOpen ? 1 : 0,
                  transform: isSearchOpen 
                    ? 'translateX(0) scale(1) rotate(0deg)' 
                    : 'scale(0.3) rotate(-180deg)',
                  pointerEvents: isSearchOpen ? 'auto' : 'none',
                  position: 'absolute',
                  left: '20px',
                  transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ color: 'var(--color-classic-black)' }}
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Десктопная версия: иконка поиска слева - всегда видна */}
            <button
              onClick={openSearch}
              className="hidden md:block p-2 hover:opacity-70 transition-opacity"
              aria-label="Поиск"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ color: 'var(--color-classic-black)' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

            {/* Центральная часть - ссылки или инпут */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              {/* Инпут для поиска */}
              {panelType === 'search' && (
                <input
                  ref={headerSearchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Поиск по названию лота..."
                  className={`header-search-input absolute left-4 right-4 px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-none focus:outline-none focus:border-gray-500 ${
                    isSearchOpen ? 'header-search-input-enter' : 'header-search-input-exit'
                  }`}
                  style={{
                    fontFamily: 'var(--font-open-sans)',
                    color: 'var(--color-classic-black)',
                  }}
                />
              )}
              
              {/* Навигационные ссылки - только на десктопе */}
              <nav className={`hidden md:flex header-nav-links items-center gap-6 sm:gap-8 md:gap-12 ${
                !isSearchOpen || panelType === 'phone' || panelType === 'auctions' ? 'header-nav-links-enter' : 'header-nav-links-exit'
              }`}>
                {menuItems.map((item) => (
                  item.isPanel ? (
                    <button
                      key={item.href}
                      onClick={openAuctions}
                      className="group relative text-xs sm:text-sm hover:opacity-70 transition-opacity"
                      style={{ 
                        fontFamily: 'var(--font-open-sans)',
                        color: 'var(--color-classic-black)',
                        letterSpacing: '0.05em',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {item.label}
                      <span className="nav-link-underline absolute bottom-0 left-0 right-0 h-px bg-current"></span>
                    </button>
                  ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchValue('');
                    }}
                    className="group relative text-xs sm:text-sm hover:opacity-70 transition-opacity"
                    style={{ 
                      fontFamily: 'var(--font-open-sans)',
                      color: 'var(--color-classic-black)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {item.label}
                    <span className="nav-link-underline absolute bottom-0 left-0 right-0 h-px bg-current"></span>
                  </Link>
                  )
                ))}
              </nav>
            </div>

            {/* Справа - крестик при поиске или иконка звонка (десктоп) / бургер (мобильный) */}
            <div className="relative w-10 h-10">
              {/* Мобильный бургер/крестик - всегда виден, но показывает крестик когда открыто меню */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden absolute inset-0 p-2 hover:opacity-70 transition-opacity"
                aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              >
                <div className="relative w-5 h-5">
                  {/* Верхняя линия */}
                  <span
                    className={`absolute top-0 left-0 w-full h-[1.5px] bg-black transition-all duration-500 ease-in-out ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-[9px]' : 'translate-y-0'
                    }`}
                    style={{
                      transformOrigin: 'center',
                    }}
                  />
                  {/* Средняя линия */}
                  <span
                    className={`absolute top-1/2 left-0 w-full h-[1.5px] bg-black transition-all duration-500 ease-in-out ${
                      isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                    }`}
                    style={{
                      transform: 'translateY(-50%)',
                      transformOrigin: 'center',
                    }}
                  />
                  {/* Нижняя линия */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-black transition-all duration-500 ease-in-out ${
                      isMobileMenuOpen ? '-rotate-45 -translate-y-[9px]' : 'translate-y-0'
                    }`}
                    style={{
                      transformOrigin: 'center',
                    }}
                  />
                </div>
              </button>

                {/* Десктоп: крестик для закрытия */}
              <button
                onClick={closeAllPanels}
                className={`hidden md:block header-icon-button absolute inset-0 p-2 hover:opacity-70 ${
                  isSearchOpen ? 'header-icon-button-enter' : 'header-icon-button-exit'
                }`}
                aria-label="Закрыть"
                style={{
                  zIndex: isSearchOpen ? 10 : 0,
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ color: 'var(--color-classic-black)' }}
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              {/* Десктоп: иконка звонка */}
              <button
                onClick={openPhone}
                className={`hidden md:block header-icon-button absolute inset-0 p-2 hover:opacity-70 ${
                  !isSearchOpen ? 'header-icon-button-enter' : 'header-icon-button-exit'
                }`}
                aria-label="Заказать звонок"
                style={{
                  zIndex: !isSearchOpen ? 10 : 0,
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ color: 'var(--color-classic-black)' }}
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Мобильное меню - выезжает из-под хеддера */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden search-container fixed left-0 right-0 overflow-hidden shadow-lg ${
          isMobileMenuOpen ? 'search-container-open' : 'search-container-closed'
        }`}
        style={{
          top: `${headerHeight}px`,
          bottom: 0,
          zIndex: 45,
          backgroundColor: '#faf9f7',
        }}
      >
        <div className="h-full flex flex-col">
          <div className="container mx-auto px-4 sm:px-6 h-full">
            <nav className="py-8 space-y-0">
              {menuItems.map((item, index) => (
                <div key={item.href} className="border-b border-gray-200">
                  {item.isPanel ? (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuctions();
                      }}
                      className="w-full flex items-center justify-between py-4 text-left group"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: 'var(--color-classic-black)',
                        fontSize: '14px',
                        letterSpacing: '0.05em',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{item.label}</span>
                      <span className="text-[#5c1a1a] group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsSearchOpen(false);
                        setSearchValue('');
                      }}
                      className="w-full flex items-center justify-between py-4 text-left group"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: 'var(--color-classic-black)',
                        fontSize: '14px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <span>{item.label}</span>
                      <span className="text-[#5c1a1a] group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Поле поиска - плавно раскрывается до самого низа экрана */}
      <div
        ref={searchContainerRef}
        className={`search-container fixed left-0 right-0 md:overflow-hidden overflow-y-auto shadow-lg ${
          isSearchOpen ? 'search-container-open' : 'search-container-closed'
        }`}
        style={{
          top: `${headerHeight}px`,
          bottom: 0,
          zIndex: 45,
          backgroundColor: '#faf9f7',
        }}
      >
        <div className="min-h-full flex flex-col relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 md:h-full">
            <div className="pt-2 sm:pt-3 pb-2 sm:pb-3">
              {panelType === 'search' ? (
                /* Панель поиска с фильтрами и промо-контентом */
                searchValue.trim() ? (
                  /* Результаты поиска */
                  <div className="h-full py-8 overflow-y-auto">
                    <div className="container mx-auto px-4">
                      {/* Инпут поиска на мобильных */}
                      <div className="md:hidden mb-8">
                        <input
                          ref={mobileSearchInputRef}
                          type="text"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          placeholder="Поиск по названию лота..."
                          className="w-full px-6 py-4 text-base bg-transparent border-b border-gray-300 rounded-none focus:outline-none focus:border-black transition-colors duration-300"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            color: 'var(--color-classic-black)',
                            letterSpacing: '0.02em',
                            fontSize: '15px',
                          }}
                        />
                      </div>
                      <h3 className="text-lg mb-4" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                        {isSearching ? 'Поиск...' : `Найдено: ${searchResults.length}`}
                      </h3>
                      
                      {searchResults.length === 0 && !isSearching ? (
                        <p className="text-gray-500 text-sm">Ничего не найдено</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {searchResults.map((result) => (
                            <Link
                              key={result.id}
                              href={`/auctions/${result.id}`}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchValue('');
                              }}
                              className="border border-gray-200 hover:border-black transition-all duration-300 group"
                            >
                              <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
                                {result.images && result.images.length > 0 ? (
                                  <img
                                    src={result.images[0]}
                                    alt={result.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                      <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h4 
                                  className="text-sm mb-2 line-clamp-2"
                                  style={{ 
                                    fontFamily: 'var(--font-playfair-display)',
                                    fontWeight: 400,
                                    letterSpacing: '0.01em',
                                  }}
                                >
                                  {result.name}
                                </h4>
                                <p 
                                  className="text-sm text-gray-600"
                                  style={{ fontFamily: 'var(--font-open-sans)' }}
                                >
                                  {result.starting_price}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : auctionCategories.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Загрузка категорий...</p>
                  </div>
                ) : (
                <>
                  {/* Мобильная версия - только категории */}
                  <div className="md:hidden flex flex-col justify-start pt-8 pb-12">
                    {/* Инпут поиска */}
                    <div className="px-6 mb-8">
                      <input
                        ref={mobileSearchInputRef}
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Поиск по названию лота..."
                        className="w-full px-6 py-4 text-base bg-transparent border-b border-gray-300 rounded-none focus:outline-none focus:border-black transition-colors duration-300"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          color: 'var(--color-classic-black)',
                          letterSpacing: '0.02em',
                          fontSize: '15px',
                        }}
                      />
                    </div>
                    <nav className="space-y-0">
                      {auctionCategories.map((category, index) => (
                        <Link
                          key={category.href}
                          href={category.href}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchValue('');
                          }}
                          className="flex items-center justify-between py-5 px-6 border-b border-gray-200/50 group w-full text-left transition-all duration-300 hover:bg-white/50"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            fontSize: '16px',
                            letterSpacing: '0.05em',
                            color: '#000000',
                          }}
                        >
                          <span className="group-hover:text-[#5c1a1a] transition-colors duration-300">{category.label}</span>
                          <span className="text-[#5c1a1a] group-hover:translate-x-2 transition-transform duration-300">→</span>
                        </Link>
                      ))}
                    </nav>
                  </div>

                  {/* Десктопная версия - с изображениями */}
                  <div className="hidden md:flex h-full gap-8 py-8">
                    {/* Левая часть - фильтры */}
                    <div className="flex-1 max-w-md">
                      <nav 
                        className="space-y-0"
                        onMouseLeave={() => {
                          if (selectedCategory !== clickedCategory) {
                            setIsImageChanging(true);
                            setTimeout(() => {
                              setSelectedCategory(clickedCategory);
                              setTimeout(() => {
                                setIsImageChanging(false);
                              }, 50);
                            }, 300);
                          }
                        }}
                      >
                        {auctionCategories.map((category, index) => (
                          <button
                            key={category.href}
                            onClick={() => {
                              setClickedCategory(index);
                              setIsImageChanging(true);
                              setTimeout(() => {
                                setSelectedCategory(index);
                                setTimeout(() => {
                                  setIsImageChanging(false);
                                }, 50);
                              }, 300);
                            }}
                            onMouseEnter={(e) => {
                              if (index !== selectedCategory) {
                                setIsImageChanging(true);
                                setTimeout(() => {
                                  setSelectedCategory(index);
                                  setTimeout(() => {
                                    setIsImageChanging(false);
                                  }, 50);
                                }, 300);
                              }
                              e.currentTarget.style.color = '#5c1a1a';
                            }}
                            onMouseLeave={(e) => {
                              if (index !== selectedCategory) {
                                e.currentTarget.style.color = '#000000';
                              }
                            }}
                            className={`flex items-center justify-between py-2.5 px-4 group w-full text-left ${
                              index === selectedCategory ? 'text-[#5c1a1a]' : 'text-black'
                            }`}
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              fontSize: '14px',
                              letterSpacing: '0.02em',
                              background: 'none',
                              border: 'none',
                              padding: '10px 16px',
                              cursor: 'pointer',
                              color: index === selectedCategory ? '#5c1a1a' : '#000000',
                              transition: 'color 0.4s ease-in-out',
                            }}
                          >
                            <span>{category.label}</span>
                            <span className="text-[#5c1a1a]">→</span>
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Вертикальная линия-разделитель */}
                    <div className="w-px bg-gray-200"></div>

                    {/* Правая часть - промо-контент */}
                    <div className="flex-1 flex items-center justify-end relative">
                      {/* Кнопка "Посмотреть все" в левом верхнем углу правой панели */}
                      <div className="absolute top-0 left-0">
                        <Link
                          href={auctionCategories[selectedCategory].href}
                          className="text-sm text-[#5c1a1a] hover:text-[#5c1a1a]"
                          style={{
                            fontFamily: 'var(--font-playfair-display)',
                            letterSpacing: '0.01em',
                            opacity: isImageChanging ? 0 : 1,
                            transform: isImageChanging ? 'translateY(-10px)' : 'translateY(0)',
                            transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                          }}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchValue('');
                          }}
                        >
                          Посмотреть все
                        </Link>
                      </div>
                      
                      <div className="flex flex-col items-end relative" style={{ width: '280px' }}>
                        {/* Маленькое изображение */}
                        <div className="relative overflow-hidden mb-0" style={{ width: '280px', height: '400px', flexShrink: 0 }}>
                          <img
                            src={auctionCategories[selectedCategory].image}
                            alt={auctionCategories[selectedCategory].label}
                            className="w-full h-full"
                            style={{ 
                              display: 'block',
                              objectFit: 'cover',
                              objectPosition: 'center center',
                              width: '100%',
                              height: '100%',
                              opacity: isImageChanging ? 0 : 1,
                              transform: isImageChanging ? 'scale(1.05)' : 'scale(1)',
                              transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                            }}
                          />
                        </div>
                        
                        {/* Панель с текстом - накладывается на изображение */}
                        <div 
                          className="px-3 py-4 text-center absolute z-10" 
                          style={{ 
                            width: '140px',
                            minHeight: '80px',
                            left: '50%',
                            bottom: '0',
                            transform: isImageChanging ? 'translate(-50%, 10px)' : 'translate(-50%, 50%)',
                            backgroundColor: '#faf9f7',
                            opacity: isImageChanging ? 0 : 1,
                            transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                          }}
                        >
                          <h3
                            className="text-sm mb-2"
                            style={{
                              fontFamily: 'var(--font-playfair-display)',
                              color: '#5c1a1a',
                              fontWeight: 400,
                              letterSpacing: '0.01em',
                              lineHeight: '1.2',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '32px',
                            }}
                          >
                            {auctionCategories[selectedCategory].label}
                          </h3>
                          <Link
                            href={auctionCategories[selectedCategory].href}
                            className="text-[10px] text-[#5c1a1a] relative inline-block group"
                            style={{
                              fontFamily: 'var(--font-playfair-display)',
                              letterSpacing: '0.01em',
                            }}
                            onClick={() => setIsSearchOpen(false)}
                          >
                            <span className="inline-block origin-right scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out">– </span>
                            <span>Посмотреть все</span>
                            <span className="inline-block origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out"> –</span>
                            <span 
                              className="absolute bottom-0 left-0 right-0 h-px bg-[#5c1a1a] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-in-out"
                            />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
                )
              ) : panelType === 'auctions' ? (
                /* Панель аукционов с фильтрами и промо-контентом */
                auctionCategories.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Загрузка категорий...</p>
                  </div>
                ) : (
                <div className="h-full flex gap-8 py-8">
                  {/* Левая часть - фильтры */}
                  <div className="flex-1 max-w-md">
                    <nav 
                      className="space-y-0"
                      onMouseLeave={() => {
                        if (selectedCategory !== clickedCategory) {
                          setIsImageChanging(true);
                          setTimeout(() => {
                            setSelectedCategory(clickedCategory);
                            setTimeout(() => {
                              setIsImageChanging(false);
                            }, 50);
                          }, 300);
                        }
                      }}
                    >
                      {auctionCategories.map((category, index) => (
                        <button
                          key={category.href}
                          onClick={() => {
                            setClickedCategory(index);
                            setIsImageChanging(true);
                            setTimeout(() => {
                              setSelectedCategory(index);
                              setTimeout(() => {
                                setIsImageChanging(false);
                              }, 50);
                            }, 300);
                          }}
                          onMouseEnter={(e) => {
                            if (index !== selectedCategory) {
                              setIsImageChanging(true);
                              setTimeout(() => {
                                setSelectedCategory(index);
                                setTimeout(() => {
                                  setIsImageChanging(false);
                                }, 50);
                              }, 300);
                            }
                            e.currentTarget.style.color = '#5c1a1a';
                          }}
                          onMouseLeave={(e) => {
                            if (index !== selectedCategory) {
                              e.currentTarget.style.color = '#000000';
                            }
                          }}
                          className={`flex items-center justify-between py-2.5 px-4 group w-full text-left ${
                            index === selectedCategory ? 'text-[#5c1a1a]' : 'text-black'
                          }`}
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            fontSize: '14px',
                            letterSpacing: '0.02em',
                            background: 'none',
                            border: 'none',
                            padding: '10px 16px',
                            cursor: 'pointer',
                            color: index === selectedCategory ? '#5c1a1a' : '#000000',
                            transition: 'color 0.4s ease-in-out',
                          }}
                        >
                          <span>{category.label}</span>
                          <span className="text-[#5c1a1a]">→</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Вертикальная линия-разделитель */}
                  <div className="w-px bg-gray-200"></div>

                  {/* Правая часть - промо-контент */}
                  <div className="flex-1 flex items-center justify-end relative">
                    {/* Кнопка "Посмотреть все" в левом верхнем углу правой панели */}
                    <div className="absolute top-0 left-0">
                      <Link
                        href={auctionCategories[selectedCategory].href}
                        className="text-sm text-[#5c1a1a] hover:text-[#5c1a1a]"
                        style={{
                          fontFamily: 'var(--font-playfair-display)',
                          letterSpacing: '0.01em',
                          opacity: isImageChanging ? 0 : 1,
                          transform: isImageChanging ? 'translateY(-10px)' : 'translateY(0)',
                          transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                        }}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchValue('');
                        }}
                      >
                        Посмотреть все
                      </Link>
                    </div>
                    
                    <div className="flex flex-col items-end relative" style={{ width: '280px' }}>
                      {/* Маленькое изображение */}
                      <div className="relative overflow-hidden mb-0" style={{ width: '280px', height: '400px', flexShrink: 0 }}>
                        <img
                          src={auctionCategories[selectedCategory].image}
                          alt={auctionCategories[selectedCategory].label}
                          className="w-full h-full"
                          style={{ 
                            display: 'block',
                            objectFit: 'cover',
                            objectPosition: 'center center',
                            width: '100%',
                            height: '100%',
                            opacity: isImageChanging ? 0 : 1,
                            transform: isImageChanging ? 'scale(1.05)' : 'scale(1)',
                            transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                          }}
                        />
                      </div>
                      
                      {/* Панель с текстом - накладывается на изображение */}
                      <div 
                        className="px-3 py-4 text-center absolute z-10" 
                        style={{ 
                          width: '140px',
                          minHeight: '80px',
                          left: '50%',
                          bottom: '0',
                          transform: isImageChanging ? 'translate(-50%, 10px)' : 'translate(-50%, 50%)',
                          backgroundColor: '#faf9f7',
                          opacity: isImageChanging ? 0 : 1,
                          transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                        }}
                      >
                        <h3
                          className="text-sm mb-2"
                          style={{
                            fontFamily: 'var(--font-playfair-display)',
                            color: '#5c1a1a',
                            fontWeight: 400,
                            letterSpacing: '0.01em',
                            lineHeight: '1.2',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '32px',
                          }}
                        >
                          {auctionCategories[selectedCategory].label}
                        </h3>
                        <Link
                          href={auctionCategories[selectedCategory].href}
                          className="text-[10px] text-[#5c1a1a] relative inline-block group"
                          style={{
                            fontFamily: 'var(--font-playfair-display)',
                            letterSpacing: '0.01em',
                          }}
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <span className="inline-block origin-right scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out">– </span>
                          <span>Посмотреть все</span>
                          <span className="inline-block origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out"> –</span>
                          <span 
                            className="absolute bottom-0 left-0 right-0 h-px bg-[#5c1a1a] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-in-out"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                )
              ) : (
                /* Контакты - Old Money стиль */
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12 px-4">
                  <div className="w-full max-w-md">
                    {/* Заголовок */}
                    <div 
                      className="text-center mb-10"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        color: 'var(--color-classic-black)',
                      }}
                    >
                      <h2 
                        className="text-2xl mb-3 font-normal italic"
                        style={{
                          letterSpacing: '0.01em',
                          lineHeight: '1.3'
                        }}
                      >
                        Свяжитесь с нами
                      </h2>
                      <div className="flex items-center justify-center gap-3 my-4">
                        <div className="h-px bg-gray-300 flex-1 max-w-[40px]"></div>
                        <div 
                          className="text-[10px] uppercase tracking-[0.15em]"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            color: 'var(--color-marble-grey-regular)',
                            letterSpacing: '0.15em'
                          }}
                        >
                          We are here for you
                        </div>
                        <div className="h-px bg-gray-300 flex-1 max-w-[40px]"></div>
                      </div>
                      <p 
                        className="text-xs mt-4"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          color: 'var(--color-marble-grey-regular)',
                          letterSpacing: '0.03em',
                          fontWeight: 300
                        }}
                      >
                        Наши специалисты готовы ответить на все ваши вопросы
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Номер телефона */}
                      <div className="text-center">
                        <div 
                          className="text-[10px] uppercase tracking-[0.12em] mb-3"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            color: 'var(--color-marble-grey-regular)',
                            letterSpacing: '0.12em',
                            fontWeight: 400
                          }}
                        >
                          Телефон
                        </div>
                        <a
                          href="tel:+74959432143"
                          className="group inline-flex items-center gap-3 hover:opacity-70 transition-opacity duration-300"
                          style={{
                            fontFamily: 'var(--font-playfair-display)',
                            color: 'var(--color-classic-black)',
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform duration-300 group-hover:scale-105"
                            style={{ color: 'var(--color-classic-black)' }}
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          <span 
                            className="text-xl font-normal tracking-wide"
                            style={{
                              letterSpacing: '0.03em'
                            }}
                          >
                            +7 495 943 21 43
                          </span>
                        </a>
                      </div>

                      {/* Информация о товаре (если есть) */}
                      {productInfo && (
                        <div className="p-4 bg-gray-50 border border-gray-200 mb-6">
                          <div 
                            className="text-[10px] uppercase tracking-[0.15em] mb-3 text-center"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-marble-grey-regular)',
                              letterSpacing: '0.15em'
                            }}
                          >
                            Интересующий лот
                          </div>
                          <div className="space-y-2">
                            <p 
                              className="text-sm font-medium text-center"
                              style={{
                                fontFamily: 'var(--font-playfair-display)',
                                color: '#000000',
                                letterSpacing: '0.01em'
                              }}
                            >
                              {productInfo.productName}
                            </p>
                            <p 
                              className="text-xs text-center"
                              style={{
                                fontFamily: 'var(--font-open-sans)',
                                color: '#696969',
                                letterSpacing: '0.03em'
                              }}
                            >
                              {productInfo.productPrice}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Декоративный разделитель */}
                      <div className="flex items-center justify-center py-2">
                        <div className="h-px bg-gray-200 w-full max-w-[60px]"></div>
                        <div 
                          className="mx-3 text-sm"
                          style={{
                            fontFamily: 'var(--font-playfair-display)',
                            color: 'var(--color-marble-grey-light)',
                            fontStyle: 'italic'
                          }}
                        >
                          или
                        </div>
                        <div className="h-px bg-gray-200 w-full max-w-[60px]"></div>
                      </div>

                      {/* Мессенджеры */}
                      <div className="pt-2 space-y-3">
                        {/* WhatsApp */}
                        <a
                          href={productInfo 
                            ? `https://wa.me/74959432143?text=${encodeURIComponent(`Здравствуйте! Меня интересует:\n\n${productInfo.productName}\n${productInfo.productPrice}\n\nСсылка: ${productInfo.productUrl}`)}`
                            : "https://wa.me/74959432143"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex items-center justify-center gap-3 w-full px-6 py-3 bg-white transition-all duration-500 ease-in-out hover:bg-[#5c1a1a]"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            letterSpacing: '0.12em',
                            border: '1px solid #5c1a1a'
                          }}
                        >
                          <div className="relative flex items-center gap-3 z-10 text-[#5c1a1a] group-hover:!text-white transition-colors duration-500">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              className="transition-all duration-300 group-hover:scale-105"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span 
                              className="text-xs font-normal uppercase tracking-wider"
                              style={{
                                letterSpacing: '0.15em'
                              }}
                            >
                              WhatsApp
                            </span>
                          </div>
                        </a>

                        {/* Telegram */}
                        <a
                          href="https://t.me/hwangs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex items-center justify-center gap-3 w-full px-6 py-3 bg-white transition-all duration-500 ease-in-out hover:bg-[#5c1a1a]"
                          style={{
                            fontFamily: 'var(--font-open-sans)',
                            letterSpacing: '0.12em',
                            border: '1px solid #5c1a1a'
                          }}
                        >
                          <div className="relative flex items-center gap-3 z-10 text-[#5c1a1a] group-hover:!text-white transition-colors duration-500">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                              className="transition-all duration-300 group-hover:scale-105"
                            >
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            <span 
                              className="text-xs font-normal uppercase tracking-wider"
                              style={{
                                letterSpacing: '0.15em'
                              }}
                            >
                              Telegram
                            </span>
                          </div>
                        </a>
                      </div>

                      {/* Email и адрес */}
                      <div className="text-center pt-6 space-y-4 border-t border-gray-200 mt-6">
                        {/* Email */}
                        <div>
                          <div 
                            className="text-[10px] uppercase tracking-[0.12em] mb-2"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-marble-grey-regular)',
                              letterSpacing: '0.12em',
                              fontWeight: 400
                            }}
                          >
                            Электронная почта
                          </div>
                          <a
                            href="mailto:ceo@hwangs.ru"
                            className="group inline-flex items-center gap-2 hover:opacity-70 transition-opacity duration-300"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-classic-black)',
                              letterSpacing: '0.02em',
                              fontSize: '13px'
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition-transform duration-300 group-hover:translate-y-[-1px]"
                            >
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <span>ceo@hwangs.ru</span>
                          </a>
                        </div>

                        {/* Адрес */}
                        <div>
                          <div 
                            className="text-[10px] uppercase tracking-[0.12em] mb-2"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-marble-grey-regular)',
                              letterSpacing: '0.12em',
                              fontWeight: 400
                            }}
                          >
                            Адрес
                          </div>
                          <address
                            className="not-italic text-xs leading-relaxed"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-classic-black)',
                              letterSpacing: '0.02em',
                              lineHeight: '1.6'
                            }}
                          >
                            Москва, улица Тверская, 1<br />
                            БЦ «Империя», 5 этаж
                          </address>
                        </div>

                        {/* Часы работы */}
                        <div>
                          <div 
                            className="text-[10px] uppercase tracking-[0.12em] mb-2"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-marble-grey-regular)',
                              letterSpacing: '0.12em',
                              fontWeight: 400
                            }}
                          >
                            Часы работы
                          </div>
                          <div
                            className="text-xs leading-relaxed"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: 'var(--color-classic-black)',
                              letterSpacing: '0.02em',
                              lineHeight: '1.6'
                            }}
                          >
                            Пн-Пт: 10:00 - 19:00<br />
                            Сб: 11:00 - 17:00
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
