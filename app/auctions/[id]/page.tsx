'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuctionCard from '../../components/AuctionCard';

interface Auction {
  id: number;
  name: string;
  additional_info?: string;
  starting_price: string;
  auction_dates?: string;
  certificate_url?: string; // Старое поле для обратной совместимости
  certificates?: Array<{
    url: string;
    type: 'image' | 'pdf';
  }>; // Новое поле для множественных сертификатов
  images: string[];
  category?: string;
  subcategory?: string;
  detail_sections?: Array<{
    title: string;
    content: string;
  }>;
}

interface RelatedAuction {
  id: number;
  name: string;
  additional_info?: string;
  starting_price: string;
  auction_dates?: string;
  images: string[];
}

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [relatedAuctions, setRelatedAuctions] = useState<RelatedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [headerHeight, setHeaderHeight] = useState(120);
  const [isLargeScreen, setIsLargeScreen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [imagesContainerMousePosition, setImagesContainerMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringImagesArea, setIsHoveringImagesArea] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
  const [relatedAuctionsIndex, setRelatedAuctionsIndex] = useState(0);
  const [carouselItemWidth, setCarouselItemWidth] = useState(0);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCertificateFullscreenOpen, setIsCertificateFullscreenOpen] = useState(false);
  const [fullscreenCertificateIndex, setFullscreenCertificateIndex] = useState(0);
  
  // Состояния для мобильной версии фотографий
  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  
  // Состояния для раскрытия секций футера на мобильных
  const [openFooterSections, setOpenFooterSections] = useState<Record<string, boolean>>({});

  const toggleFooterSection = (section: string) => {
    setOpenFooterSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const imagesContainerRef = useRef<HTMLDivElement>(null);
  const zoomImageRef = useRef<HTMLImageElement>(null);
  const relatedCarouselRef = useRef<HTMLDivElement>(null);
  const relatedCarouselItemRef = useRef<HTMLDivElement>(null);

  // Функция для получения всех сертификатов
  const getAllCertificates = () => {
    if (!auction) return [];
    
    let parsedCertificates = [];
    if (auction.certificates) {
      if (typeof auction.certificates === 'string') {
        try {
          parsedCertificates = JSON.parse(auction.certificates);
        } catch (e) {
          console.error('Ошибка парсинга certificates:', e);
          parsedCertificates = [];
        }
      } else if (Array.isArray(auction.certificates)) {
        parsedCertificates = auction.certificates;
      }
    }
    
    return parsedCertificates.length > 0
      ? parsedCertificates
      : auction.certificate_url
        ? [{ url: auction.certificate_url, type: auction.certificate_url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' }]
        : [];
  };

  // Загрузка данных аукциона
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/auctions/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          // Парсим certificates, если это строка JSON (на случай, если pg вернул строку)
          if (data.auction.certificates) {
            if (typeof data.auction.certificates === 'string') {
              try {
                data.auction.certificates = JSON.parse(data.auction.certificates);
              } catch (e) {
                console.error('Ошибка парсинга certificates:', e);
                data.auction.certificates = [];
              }
            } else if (!Array.isArray(data.auction.certificates)) {
              // Если это не массив и не строка, делаем пустым массивом
              data.auction.certificates = [];
            }
          } else {
            // Если certificates отсутствует, делаем пустым массивом
            data.auction.certificates = [];
          }
          setAuction(data.auction);
          setRelatedAuctions(data.relatedAuctions || []);
          
        } else {
          console.error('Ошибка загрузки аукциона:', data.error);
        }
      } catch (error) {
        console.error('Ошибка при загрузке аукциона:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuction();
    }
  }, [id]);

  // Получение высоты хедера и размера экрана
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    const handleResize = () => {
      updateHeaderHeight();
      checkScreenSize();
    };

    // Инициализация при монтировании
    updateHeaderHeight();
    checkScreenSize();
    
    // Небольшая задержка для первого рендера
    const timeoutId = setTimeout(() => {
      updateHeaderHeight();
      checkScreenSize();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Вычисление ширины элемента карусели
  useEffect(() => {
    const updateCarouselItemWidth = () => {
      if (relatedCarouselRef.current && relatedCarouselItemRef.current) {
        const containerWidth = relatedCarouselRef.current.offsetWidth;
        const itemsPerView = isLargeScreen ? 4 : (window.innerWidth >= 640 ? 2 : 1);
        const gap = 24; // 1.5rem = 24px
        const itemWidth = (containerWidth - (gap * (itemsPerView - 1))) / itemsPerView;
        setCarouselItemWidth(itemWidth);
      }
    };

    // Небольшая задержка для первого рендера
    const timeoutId = setTimeout(updateCarouselItemWidth, 100);
    updateCarouselItemWidth();
    
    window.addEventListener('resize', updateCarouselItemWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCarouselItemWidth);
    };
  }, [isLargeScreen, relatedAuctions.length]);

  // Обработчики для свайпа на мобильных
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !auction) return;
    
    const images = auction.images && auction.images.length > 0 ? auction.images : ['/11.jpg'];
    if (!images.length) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setMobileImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe) {
      setMobileImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Обработка Escape для закрытия модального окна
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomModalOpen) {
        setIsZoomModalOpen(false);
        setIsZooming(false);
      }
      if (e.key === 'Escape' && isFullscreenModalOpen) {
        setIsFullscreenModalOpen(false);
      }
      if (e.key === 'Escape' && isCertificateModalOpen) {
        setIsCertificateModalOpen(false);
        setIsCertificateFullscreenOpen(false);
      }
      if (e.key === 'Escape' && isCertificateFullscreenOpen) {
        setIsCertificateFullscreenOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isZoomModalOpen, isFullscreenModalOpen, isCertificateModalOpen, isCertificateFullscreenOpen]);

  // Блокировка скролла при открытом модальном окне
  useEffect(() => {
    if (isZoomModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isZoomModalOpen]);

  // Обработка панорамирования с ограничениями границ
  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Сохраняем позицию курсора для круга
    setCursorPosition({ x: e.clientX, y: e.clientY });
    
    if (!isZooming || !zoomImageRef.current) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Позиция мыши относительно контейнера (0-100%)
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    // При зуме 2x, изображение в 2 раза больше контейнера
    // Максимальное смещение = 50% (половина размера выходит за границы)
    // Ограничиваем смещение так, чтобы край картинки был на краю контейнера
    const maxOffset = 25; // При scale(2), это максимум что можем сдвинуть
    
    // Вычисляем смещение на основе позиции мыши
    // Центр (50%) = 0 смещение, края (0% и 100%) = максимальное смещение
    const offsetX = (50 - mouseX) * 0.5; // Коэффициент 0.5 для плавности
    const offsetY = (50 - mouseY) * 0.5;
    
    // Ограничиваем смещение
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
    const clampedY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));

    setZoomPosition({ x: clampedX, y: clampedY });
  };

  const handleZoomClick = () => {
    setIsZooming(!isZooming);
    if (!isZooming) {
      // При включении зума - центрируем
      setZoomPosition({ x: 0, y: 0 });
    }
  };

  // Обработка движения мыши над панелью с фотографиями
  const handleImagesContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setImagesContainerMousePosition({ x, y });
    setIsHoveringImagesArea(true);
  };

  const handleImagesContainerMouseLeave = () => {
    setIsHoveringImagesArea(false);
    setImagesContainerMousePosition(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-40 sm:pt-48 md:pt-56">
        <p className="text-sm" style={{ fontFamily: 'var(--font-open-sans)' }}>
          Загрузка...
        </p>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-40 sm:pt-48 md:pt-56">
        <p className="text-sm" style={{ fontFamily: 'var(--font-open-sans)' }}>
          Аукцион не найден
        </p>
      </div>
    );
  }

  const images = auction.images && auction.images.length > 0 ? auction.images : ['/11.jpg'];
  const imagesPerRow = 2;
  const totalRows = Math.ceil(images.length / imagesPerRow);

  return (
    <div className="w-full bg-white">
      {/* Основной контент */}
      <section className="w-full bg-white pt-40 sm:pt-48 md:pt-56 pb-12 sm:pb-16">
        <div className="container mx-auto px-0 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-8 xl:gap-10 lg:items-stretch" style={{ position: 'relative' }}>
              {/* Левая часть - фотографии */}
              <div 
                ref={imagesContainerRef}
                className="relative space-y-4 sm:space-y-6 lg:px-4"
                onMouseMove={handleImagesContainerMouseMove}
                onMouseLeave={handleImagesContainerMouseLeave}
                style={{ overflow: 'visible' }}
              >
                {/* Мобильная версия - одна большая фотография с свайпом */}
                <div className="lg:hidden relative w-full -mx-4 sm:-mx-6">
                  <div 
                    className="relative w-full overflow-hidden"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onClick={() => setIsFullscreenModalOpen(true)}
                  >
                    <div 
                      className="flex transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateX(-${mobileImageIndex * 100}%)`,
                      }}
                    >
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="w-full flex-shrink-0"
                          style={{ aspectRatio: '3/4' }}
                        >
                          <img
                            src={image}
                            alt={`${auction.name} - фото ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Индикаторы (круги) */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileImageIndex(index);
                          }}
                          className={`rounded-full transition-all duration-300 ${
                            index === mobileImageIndex 
                              ? 'w-6 h-1.5' 
                              : 'w-1.5 h-1.5'
                          }`}
                          style={{
                            backgroundColor: index === mobileImageIndex ? '#5c1a1a' : 'rgba(92, 26, 26, 0.4)'
                          }}
                          aria-label={`Перейти к фото ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Десктопная версия - сетка фотографий */}
                <div className="hidden lg:block">
                  {Array.from({ length: totalRows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-2 gap-4 sm:gap-6">
                      {Array.from({ length: imagesPerRow }).map((_, colIndex) => {
                        const imageIndex = rowIndex * imagesPerRow + colIndex;
                        const image = images[imageIndex];
                        
                        if (!image) return null;

                        return (
                          <div
                            key={imageIndex}
                            className="relative aspect-[2/3] overflow-hidden bg-gray-50 group image-container"
                            onClick={() => {
                              setZoomImageIndex(imageIndex);
                              setIsZoomModalOpen(true);
                              setIsZooming(true);
                              setZoomPosition({ x: 0, y: 0 });
                            }}
                          >
                            <img
                              src={image}
                              alt={`${auction.name} - фото ${imageIndex + 1}`}
                              className="product-image w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                
                {/* Лупа - следует за мышкой по всей панели (только на десктопе) */}
                {imagesContainerMousePosition && (
                  <div
                    className={`hidden lg:block magnifying-glass absolute pointer-events-none ${isHoveringImagesArea ? 'magnifying-glass-visible' : 'magnifying-glass-hidden'}`}
                    style={{
                      left: `${imagesContainerMousePosition.x}px`,
                      top: `${imagesContainerMousePosition.y}px`,
                      zIndex: 100,
                    }}
                  >
                    {/* Стеклянный круг с SVG фильтром */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(212, 196, 184, 0.25)',
                        border: '2px solid rgba(212, 196, 184, 0.6)',
                        boxShadow: `
                          inset 0 0 30px rgba(255, 255, 255, 0.4),
                          0 8px 32px rgba(0, 0, 0, 0.25),
                          0 0 0 1px rgba(255, 255, 255, 0.1)
                        `,
                        backdropFilter: 'blur(20px) brightness(1.3) saturate(1.5)',
                        WebkitBackdropFilter: 'blur(20px) brightness(1.3) saturate(1.5)',
                      }}
                    />
                    {/* SVG поверх стеклянного круга */}
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 120 120"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Вращающееся внешнее кольцо с двумя разрывами */}
                      <g className="rotating-ring" style={{ transformOrigin: '60px 60px' }}>
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="rgba(212, 196, 184, 0.8)"
                          strokeWidth="2"
                          strokeDasharray="125 35 125 35"
                          strokeLinecap="round"
                          strokeDashoffset="0"
                        />
                      </g>
                      {/* Маленький крестик */}
                      <line
                        x1="60"
                        y1="54"
                        x2="60"
                        y2="66"
                        stroke="rgba(212, 196, 184, 0.9)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="54"
                        y1="60"
                        x2="66"
                        y2="60"
                        stroke="rgba(212, 196, 184, 0.9)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Правая часть - информация (sticky) */}
              <div className="px-4 sm:px-6 lg:px-0">
                <div 
                  className="sticky-info-panel"
                  style={{ 
                    position: isLargeScreen ? 'sticky' : 'static',
                    top: isLargeScreen ? `${headerHeight + 20}px` : 'auto',
                    height: 'fit-content',
                    maxHeight: isLargeScreen ? `calc(100vh - ${headerHeight + 40}px)` : 'none',
                  } as React.CSSProperties}
                >
                <div 
                  className="space-y-6 sm:space-y-8"
                  style={{
                    maxHeight: isLargeScreen ? `calc(100vh - ${headerHeight + 40}px)` : 'none',
                    overflowY: isLargeScreen ? 'auto' : 'visible',
                  } as React.CSSProperties}
                >
                  {/* Название */}
                  <div>
                    <h1
                      className="text-2xl sm:text-3xl md:text-4xl mb-4"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        color: '#000000',
                        fontWeight: 400,
                        letterSpacing: '0.01em',
                        lineHeight: '1.3',
                      }}
                    >
                      {auction.name}
                    </h1>
                    
                    {/* Дополнительная информация */}
                    {auction.additional_info && (
                      <p
                        className="text-sm sm:text-base text-gray-600 mb-4"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          letterSpacing: '0.02em',
                          lineHeight: '1.6',
                        }}
                      >
                        {auction.additional_info}
                      </p>
                    )}

                    {/* Материал (если есть) */}
                    {auction.subcategory && (
                      <p
                        className="text-sm sm:text-base mb-4"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          color: '#666666',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {auction.subcategory}
                      </p>
                    )}
                  </div>

                  {/* Цена */}
                  <div>
                    <p
                      className="text-xl sm:text-2xl md:text-3xl mb-2"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        color: '#000000',
                        fontWeight: 400,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {auction.starting_price.startsWith('От') 
                        ? auction.starting_price 
                        : `От ${auction.starting_price}`
                      }
                    </p>
                    
                    {/* Срок проведения аукциона */}
                    {auction.auction_dates && (
                      <p 
                        className="text-sm sm:text-base mb-4"
                        style={{
                          fontFamily: 'var(--font-playfair-display)',
                          color: '#696969',
                          fontWeight: 400,
                          fontStyle: 'italic',
                          letterSpacing: '0.01em',
                          lineHeight: '1.4',
                        }}
                      >
                        Срок проведения аукциона: {auction.auction_dates}
                      </p>
                    )}
                    
                    {/* Сертификат подлинности */}
                    <button
                      onClick={() => {
                        setIsCertificateModalOpen(true);
                      }}
                      className="group inline-flex items-center gap-2 mt-2 cursor-pointer bg-transparent border-none p-0"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        color: '#000000',
                        fontSize: '14px',
                        letterSpacing: '0.02em',
                        fontWeight: 400,
                      }}
                    >
                      <span className="relative">
                        <span className="relative z-10">Сертификат подлинности</span>
                        <span 
                          className="absolute bottom-0 left-0 w-full h-px bg-black transition-all duration-500 origin-left group-hover:scale-x-0"
                        ></span>
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-500 group-hover:translate-x-1"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>

                  {/* Кнопка участия */}
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        // Отправляем данные о товаре при открытии панели телефона
                        const event = new CustomEvent('openPhonePanelWithProduct', {
                          detail: {
                            productName: auction.name,
                            productPrice: auction.starting_price,
                            productId: auction.id,
                            productUrl: window.location.href
                          }
                        });
                        window.dispatchEvent(event);
                      }}
                      className="group relative px-12 py-4 sm:px-16 sm:py-5 overflow-hidden transition-all duration-500"
                      style={{
                        backgroundColor: '#5c1a1a',
                        color: '#FFFFFF',
                        fontFamily: 'var(--font-playfair-display)',
                        fontSize: '13px',
                        letterSpacing: '0.15em',
                        fontWeight: 400,
                        border: '1px solid #5c1a1a',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#5c1a1a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#5c1a1a';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                    >
                      ПРИНЯТЬ УЧАСТИЕ
                    </button>
                  </div>

                  {/* Описание */}
                  <div>
                    {/* Полный текст описания - будет из БД (auction.description) */}
                    <div
                      className="text-sm sm:text-base leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: '#000000',
                        letterSpacing: '0.02em',
                        lineHeight: '1.6',
                      }}
                    >
                      {auction.additional_info || 'Здесь представлен эксклюзивный лот из коллекции Hwang\'s. Каждый предмет проходит многоуровневую аутентификацию и экспертизу. Мы определяем вершину того, что может предложить рынок частных активов.'}
                    </div>
                  </div>

                  {/* Дополнительные секции (раскрывающиеся) - из БД */}
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    {auction.detail_sections && auction.detail_sections.length > 0 ? (
                      auction.detail_sections.map((section, index) => {
                        const sectionKey = `section-${index}`;
                        return (
                          <details 
                            key={index}
                            className="group"
                            onToggle={(e) => {
                              const newExpanded = new Set(expandedDetails);
                              if (e.currentTarget.open) {
                                newExpanded.add(sectionKey);
                              } else {
                                newExpanded.delete(sectionKey);
                              }
                              setExpandedDetails(newExpanded);
                            }}
                          >
                            <summary
                              className="flex items-center justify-between cursor-pointer list-none py-3"
                              style={{
                                fontFamily: 'var(--font-open-sans)',
                                color: '#000000',
                                fontSize: '14px',
                                letterSpacing: '0.02em',
                              }}
                            >
                              <span>{section.title}</span>
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
                                    opacity: expandedDetails.has(sectionKey) ? 0 : 1,
                                    transform: expandedDetails.has(sectionKey) ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
                                    transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                    pointerEvents: expandedDetails.has(sectionKey) ? 'none' : 'auto',
                                  }}
                                >
                                  +
                                </span>
                                <span
                                  style={{
                                    position: 'absolute',
                                    display: 'inline-block',
                                    opacity: expandedDetails.has(sectionKey) ? 1 : 0,
                                    transform: expandedDetails.has(sectionKey) ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                                    transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                    pointerEvents: expandedDetails.has(sectionKey) ? 'auto' : 'none',
                                  }}
                                >
                                  −
                                </span>
                              </span>
                            </summary>
                            <div
                              className="mt-4 text-sm leading-relaxed whitespace-pre-line"
                              style={{
                                fontFamily: 'var(--font-open-sans)',
                                color: '#666666',
                                letterSpacing: '0.02em',
                                lineHeight: '1.6',
                              }}
                            >
                              {section.content}
                            </div>
                          </details>
                        );
                      })
                    ) : (
                      <>
                        {/* Дефолтные секции если не настроены в админке */}
                        <details 
                          className="group"
                          onToggle={(e) => {
                            const newExpanded = new Set(expandedDetails);
                            if (e.currentTarget.open) {
                              newExpanded.add('product-details');
                            } else {
                              newExpanded.delete('product-details');
                            }
                            setExpandedDetails(newExpanded);
                          }}
                        >
                          <summary
                            className="flex items-center justify-between cursor-pointer list-none py-3"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: '#000000',
                              fontSize: '14px',
                              letterSpacing: '0.02em',
                            }}
                          >
                            <span>Детали продукта</span>
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
                                  opacity: expandedDetails.has('product-details') ? 0 : 1,
                                  transform: expandedDetails.has('product-details') ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
                                  transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                  pointerEvents: expandedDetails.has('product-details') ? 'none' : 'auto',
                                }}
                              >
                                +
                              </span>
                              <span
                                style={{
                                  position: 'absolute',
                                  display: 'inline-block',
                                  opacity: expandedDetails.has('product-details') ? 1 : 0,
                                  transform: expandedDetails.has('product-details') ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
                                  transition: 'opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                  pointerEvents: expandedDetails.has('product-details') ? 'auto' : 'none',
                                }}
                              >
                                −
                              </span>
                            </span>
                          </summary>
                          <div
                            className="mt-4 text-sm leading-relaxed"
                            style={{
                              fontFamily: 'var(--font-open-sans)',
                              color: '#666666',
                              letterSpacing: '0.02em',
                              lineHeight: '1.6',
                            }}
                          >
                            <p>Детальная информация о продукте будет здесь.</p>
                          </div>
                        </details>
                      </>
                    )}
                  </div>

                  {/* Ссылки помощи */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openPhonePanel'));
                      }}
                      className="text-sm relative inline-block group"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: '#000000',
                        letterSpacing: '0.02em',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      Нужна помощь? Свяжитесь с нами
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Секция "Наши рекомендации" */}
      {relatedAuctions.length > 0 && (
        <section className="w-full bg-white pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto">
              {/* Заголовок */}
              <div className="text-center mb-8 sm:mb-10">
                <h2
                  className="text-lg sm:text-xl md:text-2xl"
                  style={{
                    fontFamily: 'var(--font-playfair-display)',
                    color: '#000000',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    lineHeight: '1.3',
                  }}
                >
                  Наши рекомендации
                </h2>
              </div>

              {/* Карусель рекомендаций */}
              <div className="relative">
                {/* Стрелка влево */}
                {(() => {
                  const visibleItems = isLargeScreen ? 4 : (typeof window !== 'undefined' && window.innerWidth >= 640 ? 2 : 1);
                  const canGoPrev = relatedAuctions.length > visibleItems && relatedAuctionsIndex > 0;
                  
                  return canGoPrev && (
                    <button
                      onClick={() => {
                        setRelatedAuctionsIndex(Math.max(0, relatedAuctionsIndex - 1));
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 sm:-translate-x-10 z-10 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
                      style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(212, 196, 184, 0.3)',
                        boxShadow: `
                          inset 0 0 20px rgba(255, 255, 255, 0.5),
                          0 8px 32px rgba(0, 0, 0, 0.12),
                          0 0 0 1px rgba(255, 255, 255, 0.1)
                        `,
                      }}
                      aria-label="Предыдущий проект"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: '#5c1a1a' }}
                      >
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  );
                })()}

                {/* Контейнер с проектами */}
                <div ref={relatedCarouselRef} className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{
                      gap: '1.5rem',
                      transform: carouselItemWidth > 0 
                        ? `translateX(-${relatedAuctionsIndex * (carouselItemWidth + 24)}px)`
                        : 'translateX(0)',
                    }}
                  >
                    {relatedAuctions.map((relatedAuction, index) => {
                      // Определяем ширину элемента в зависимости от размера экрана
                      const getItemWidth = () => {
                        if (isLargeScreen) return 'calc((100% - 4.5rem) / 4)'; // 4 колонки: (100% - 3 gaps) / 4
                        if (typeof window !== 'undefined' && window.innerWidth >= 640) return 'calc((100% - 1.5rem) / 2)'; // 2 колонки: (100% - 1 gap) / 2
                        return '100%'; // 1 колонка на мобильных
                      };
                      
                      return (
                        <div
                          key={relatedAuction.id}
                          ref={index === 0 ? relatedCarouselItemRef : null}
                          className="flex-shrink-0"
                          style={{
                            width: getItemWidth(),
                            minWidth: getItemWidth(),
                          }}
                        >
                          <AuctionCard
                            id={relatedAuction.id.toString()}
                            name={relatedAuction.name}
                            additionalInfo={relatedAuction.additional_info || undefined}
                            startingPrice={relatedAuction.starting_price}
                            auctionDates={relatedAuction.auction_dates}
                            images={relatedAuction.images || []}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Стрелка вправо */}
                {(() => {
                  const visibleItems = isLargeScreen ? 4 : (typeof window !== 'undefined' && window.innerWidth >= 640 ? 2 : 1);
                  const canGoNext = relatedAuctions.length > visibleItems && relatedAuctionsIndex < relatedAuctions.length - visibleItems;
                  
                  return canGoNext && (
                    <button
                      onClick={() => {
                        const visibleItems = isLargeScreen ? 4 : (typeof window !== 'undefined' && window.innerWidth >= 640 ? 2 : 1);
                        const maxIndex = relatedAuctions.length - visibleItems;
                        setRelatedAuctionsIndex(Math.min(maxIndex, relatedAuctionsIndex + 1));
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 sm:translate-x-10 z-10 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
                      style={{
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(212, 196, 184, 0.3)',
                        boxShadow: `
                          inset 0 0 20px rgba(255, 255, 255, 0.5),
                          0 8px 32px rgba(0, 0, 0, 0.12),
                          0 0 0 1px rgba(255, 255, 255, 0.1)
                        `,
                      }}
                      aria-label="Следующий проект"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: '#5c1a1a' }}
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Модальное окно с лупой */}
      {isZoomModalOpen && (
        <div
          className="zoom-modal-enter fixed inset-0 z-[100] bg-black flex"
          style={{ overflow: 'visible', cursor: 'none' }}
          onClick={() => {
            setIsZoomModalOpen(false);
            setIsZooming(false);
          }}
        >
          {/* Левая панель с миниатюрами */}
          <div className="hidden lg:flex flex-col items-center justify-center w-32 p-4 space-y-3 overflow-y-auto absolute left-0 top-0 bottom-0 z-10" style={{ cursor: 'auto' }}>
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImageIndex(index);
                  setIsZooming(true);
                  setZoomPosition({ x: 0, y: 0 }); // Центрируем
                }}
                className={`thumbnail-button relative w-20 h-20 overflow-hidden border-2 ${
                  index === zoomImageIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60'
                }`}
              >
                <img
                  src={image}
                  alt={`Миниатюра ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Мобильная панель с миниатюрами (внизу) */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 p-4 overflow-x-auto bg-black/50 backdrop-blur-sm" style={{ cursor: 'auto' }}>
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImageIndex(index);
                  setIsZooming(true);
                  setZoomPosition({ x: 0, y: 0 }); // Центрируем
                }}
                className={`thumbnail-button relative w-16 h-16 flex-shrink-0 overflow-hidden border-2 ${
                  index === zoomImageIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60'
                }`}
              >
                <img
                  src={image}
                  alt={`Миниатюра ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Центральная часть - большое изображение с лупой */}
          <div
            className="flex-1 flex items-center justify-center relative w-full h-full"
            style={{ overflow: 'visible', cursor: 'none' }}
            onMouseMove={handleZoomMouseMove}
            onTouchMove={(e) => {
              if (isZooming && e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                
                // Позиция touch относительно контейнера (0-100%)
                const touchX = ((touch.clientX - rect.left) / rect.width) * 100;
                const touchY = ((touch.clientY - rect.top) / rect.height) * 100;

                // Ограничиваем смещение как и для мыши
                const maxOffset = 25;
                const offsetX = (50 - touchX) * 0.5;
                const offsetY = (50 - touchY) * 0.5;
                
                const clampedX = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
                const clampedY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));

                setZoomPosition({ x: clampedX, y: clampedY });
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleZoomClick();
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center" style={{ overflow: 'visible' }}>
              <img
                ref={zoomImageRef}
                src={images[zoomImageIndex]}
                alt={`${auction.name} - фото ${zoomImageIndex + 1}`}
                className="zoom-image-enter"
                style={{
                  position: 'fixed',
                  width: '100vw',
                  height: '100vh',
                  left: '50%',
                  top: '50%',
                  objectFit: 'cover',
                  transform: isZooming 
                    ? `translate(calc(-50% + ${zoomPosition.x}%), calc(-50% + ${zoomPosition.y}%)) scale(2)`
                    : 'translate(-50%, -50%) scale(1)',
                  touchAction: 'none',
                  willChange: 'transform',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
              
              {/* Круг следующий за курсором */}
              {isZooming && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${cursorPosition.x}px`,
                    top: `${cursorPosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '120px',
                    height: '120px',
                    zIndex: 200,
                  }}
                >
                  {/* Стеклянный круг */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                      boxShadow: `
                        inset 0 0 30px rgba(255, 255, 255, 0.4),
                        0 8px 32px rgba(0, 0, 0, 0.25),
                        0 0 0 1px rgba(255, 255, 255, 0.1)
                      `,
                      backdropFilter: 'blur(20px) brightness(1.3) saturate(1.5)',
                      WebkitBackdropFilter: 'blur(20px) brightness(1.3) saturate(1.5)',
                    }}
                  />
                  {/* SVG поверх стеклянного круга */}
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    {/* Вращающееся кольцо с разрывом */}
                    <g className="zoom-rotating-ring" style={{ transformOrigin: '60px 60px' }}>
                      <circle
                        cx="60"
                        cy="60"
                        r="58"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.7)"
                        strokeWidth="2"
                        strokeDasharray="270 90"
                        strokeLinecap="round"
                      />
                    </g>
                    {/* Крестик в центре */}
                    <line
                      x1="60"
                      y1="52"
                      x2="60"
                      y2="68"
                      stroke="rgba(255, 255, 255, 0.8)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="52"
                      y1="60"
                      x2="68"
                      y2="60"
                      stroke="rgba(255, 255, 255, 0.8)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Кнопка закрытия */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomModalOpen(false);
                setIsZooming(false);
              }}
              className="close-button absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 flex items-center justify-center text-white z-10"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Футер */}
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

      {/* Модальное окно для просмотра сертификата */}
      {isCertificateModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={() => {
            setIsCertificateModalOpen(false);
            setIsCertificateFullscreenOpen(false);
          }}
          style={{
            animation: 'certificateFadeIn 0.3s ease-out',
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes certificateFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes certificateSlideUp {
                from { 
                  opacity: 0; 
                  transform: translateY(30px); 
                }
                to { 
                  opacity: 1; 
                  transform: translateY(0); 
                }
              }
            `
          }} />
          
          {/* Контейнер модального окна */}
          <div
            className="relative max-w-6xl w-[90%] max-h-[90vh] bg-white p-4 sm:p-6 overflow-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'certificateSlideUp 0.4s ease-out',
            }}
          >
            
            {/* Заголовок */}
            <div className="mb-6">
              <h3
                className="text-xl sm:text-2xl text-center"
                style={{
                  fontFamily: 'var(--font-playfair-display)',
                  color: '#000000',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                }}
              >
                Сертификат подлинности
              </h3>
              <p
                className="text-sm text-center mt-2"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#696969',
                  letterSpacing: '0.02em',
                }}
              >
                {auction.name}
              </p>
            </div>

            {/* Сертификаты или текст об отсутствии */}
            {(() => {
              const allCertificates = getAllCertificates();

              if (allCertificates.length === 0) {
                return (
                  <div className="flex justify-center items-center py-12">
                    <p
                      className="text-base sm:text-lg text-center"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: '#696969',
                        letterSpacing: '0.02em',
                        lineHeight: '1.6',
                      }}
                    >
                      Сертификат подлинности отсутствует
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allCertificates.map((cert: { url: string; type: 'image' | 'pdf' }, index: number) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenCertificateIndex(index);
                        setIsCertificateFullscreenOpen(true);
                      }}
                      className="cursor-pointer border border-gray-200 hover:border-black transition-colors"
                    >
                      {cert.type === 'image' ? (
                        <img
                          src={cert.url}
                          alt={`Сертификат ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-600">PDF</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Модальное окно для полноэкранного просмотра сертификата */}
      {isCertificateFullscreenOpen && auction && (() => {
        const allCertificates = getAllCertificates();
        if (allCertificates.length === 0) return null;
        
        const currentCert = allCertificates[fullscreenCertificateIndex];
        
        return (
          <div
            className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
            onClick={() => setIsCertificateFullscreenOpen(false)}
          >
            <div
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {currentCert.type === 'image' ? (
                <img
                  src={currentCert.url}
                  alt={`Сертификат ${fullscreenCertificateIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={currentCert.url}
                  className="w-full h-full"
                  title={`Сертификат ${fullscreenCertificateIndex + 1}`}
                />
              )}
              
              {/* Навигация между сертификатами (если их несколько) */}
              {allCertificates.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenCertificateIndex((prev) => 
                        prev === 0 ? allCertificates.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 hover:bg-black/90 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenCertificateIndex((prev) => 
                        prev === allCertificates.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 hover:bg-black/90 transition-colors"
                  >
                    →
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded">
                    {fullscreenCertificateIndex + 1} / {allCertificates.length}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Модальное окно для полноэкранного просмотра фотографий на мобильных */}
      {isFullscreenModalOpen && images.length > 0 && (
        <div
          className="lg:hidden fixed inset-0 z-[9999] bg-black"
          onClick={() => setIsFullscreenModalOpen(false)}
        >
          <div 
            className="relative w-full h-full flex items-center"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex transition-transform duration-300 ease-out w-full h-full"
              style={{
                transform: `translateX(-${mobileImageIndex * 100}%)`,
              }}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className="w-full h-full flex-shrink-0 flex items-center justify-center"
                >
                  <img
                    src={image}
                    alt={`${auction.name} - фото ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            
            {/* Индикаторы (круги) */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileImageIndex(index);
                    }}
                    className={`rounded-full transition-all duration-300 ${
                      index === mobileImageIndex 
                        ? 'w-6 h-1.5' 
                        : 'w-1.5 h-1.5'
                    }`}
                    style={{
                      backgroundColor: index === mobileImageIndex ? '#5c1a1a' : 'rgba(92, 26, 26, 0.4)'
                    }}
                    aria-label={`Перейти к фото ${index + 1}`}
                  />
                ))}
              </div>
            )}
            
            {/* Кнопка закрытия */}
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors duration-300"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

