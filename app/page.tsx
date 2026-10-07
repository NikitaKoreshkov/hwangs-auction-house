'use client';

import Link from 'next/link';
import AuctionCard from './components/AuctionCard';
import { useEffect, useState, useRef } from 'react';

interface Auction {
  id: number;
  name: string;
  additional_info?: string;
  starting_price: string;
  auction_dates?: string;
  images: string[];
}

export default function Home() {
  const [headerHeight, setHeaderHeight] = useState(120);
  const redContainerRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);
  
  // Состояния для аукционов из БД
  const [currentAuctions, setCurrentAuctions] = useState<Auction[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  
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

  // Состояния для контента из БД
  const [hero, setHero] = useState({
    videoUrl: '/video.mp4',
    imageUrl: '',
    isVideo: true,
    line1: 'Аукционный Дом Hwang\'s',
    line2: 'Традиция эксклюзивных коллекций',
    line3: 'Первый в России аукционный дом по продаже предметов роскоши и эксклюзивных активов.',
  });

  const [description, setDescription] = useState({
    text: 'Hwang\'s — первый в России аукционный дом,\nчья экспертиза определяет вершину частных коллекций и активов.',
  });

  const [panels, setPanels] = useState([
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

  const [categories, setCategories] = useState<Array<{
    season: string;
    title: string;
    image: string;
    href: string;
    category_id?: number;
    slug?: string;
  }>>([
    { season: 'COLLECTION 2025', title: 'Часы', image: '/20.jpg', href: '/categories/watches' },
    { season: 'COLLECTION 2025', title: 'Автомобили', image: '/21.jpg', href: '/categories/cars' },
    { season: 'COLLECTION 2025', title: 'Ювелирные изделия', image: '/22.jpg', href: '/categories/jewelry' },
  ]);

  const [textImage, setTextImage] = useState({
    smallImage: '/31.jpg',
    bigImage: '/30.png',
    title: 'Искусство эксклюзивных\nколлекций',
    text: 'Созданные из редчайших материалов и бесценных артефактов, наши коллекции ценятся за уникальную историческую ценность и непревзойденное качество.',
  });

  const [imperial, setImperial] = useState({
    title: 'Коллекция Императорского Двора',
    text: 'Классическая и вневременная, первая завершенная коллекция Hwang\'s, созданная из драгоценных материалов императорской эпохи. Воплощение превосходных материалов, вечной элегантности и абсолютного комфорта. Символический мост между текстильным наследием Дома и современной коллекцией аксессуаров.',
    image: '/40.jpg',
  });

  // Загрузка контента из БД
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content/homepage');
        const data = await response.json();
        
        if (data.hero) setHero(data.hero);
        if (data.description) setDescription(data.description);
        if (data.panels) setPanels(data.panels);
        if (data.categories) {
          // Добавляем href к категориям из БД (только первые 3)
          const categoriesWithHref = data.categories.slice(0, 3).map((cat: any) => {
            return {
              ...cat,
              href: cat.slug ? `/auctions?category=${cat.slug}` : '/auctions',
            };
          });
          setCategories(categoriesWithHref);
        }
        if (data.textImage) setTextImage(data.textImage);
        if (data.imperial) setImperial(data.imperial);
      } catch (error) {
        console.error('Ошибка загрузки контента:', error);
      }
    };

    fetchContent();
  }, []);

  // Загрузка featured аукционов из БД (макс 4)
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await fetch('/api/auctions?featured=true&limit=4');
        const data = await response.json();
        setCurrentAuctions(data.auctions || []);
      } catch (error) {
        console.error('Ошибка загрузки аукционов:', error);
      } finally {
        setAuctionsLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    // Небольшая задержка для первого рендера
    setTimeout(updateHeaderHeight, 100);

    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

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

  // Исправление overflow на родительских элементах для работы sticky
  useEffect(() => {
    if (redContainerRef.current) {
      // Проверка и исправление overflow на родительских элементах
      let parent = redContainerRef.current.parentElement;
      let level = 0;
      while (parent && level < 5) {
        const parentStyle = window.getComputedStyle(parent);
        
        // Исправляем overflow, который блокирует sticky
        if (parentStyle.overflow !== 'visible' && parentStyle.overflowY !== 'visible') {
          (parent as HTMLElement).style.overflowY = 'visible';
          (parent as HTMLElement).style.overflow = 'visible';
        }
        
        parent = parent.parentElement;
        level++;
      }
    }
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden" style={{ overflowY: 'visible' }}>
      {/* Hero блок с видео */}
      <section 
        className="relative w-full flex items-center justify-center overflow-hidden md:aspect-[18/9]" 
        style={{ 
          marginTop: `${headerHeight +0}px`,
          height: 'calc(100vh - 120px)', // На мобильных заполняет весь экран
        }}
      >
        {hero.isVideo ? (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          >
            <source src={hero.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${hero.imageUrl || hero.videoUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        
        {/* Текст поверх видео */}
        <div 
          onClick={() => {
            // Открываем панель поиска
            window.dispatchEvent(new CustomEvent('openSearchPanel'));
          }}
          className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 cursor-pointer hover:opacity-90 transition-opacity duration-300 w-full max-w-5xl mx-auto"
        >
          {/* Первая строка - маленькая */}
          <p 
            className="text-xs sm:text-xs md:text-sm text-white mb-2 sm:mb-3 md:mb-4 px-2 md:whitespace-nowrap"
            style={{ 
              fontFamily: 'var(--font-open-sans)',
              fontWeight: 400,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: '1.2'
            }}
          >
            {hero.line1}
          </p>
          
          {/* Главный заголовок - большой */}
          <h1 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 md:mb-8 px-2 md:whitespace-nowrap"
            style={{ 
              fontFamily: 'var(--font-playfair-display)',
              letterSpacing: '0.01em',
              lineHeight: '1.1',
              textAlign: 'center'
            }}
          >
            {hero.line2}
          </h1>
          
          {/* Описание - маленькое */}
          <p 
            className="text-xs sm:text-xs md:text-sm text-white px-2 md:whitespace-nowrap"
            style={{ 
              fontFamily: 'var(--font-open-sans)',
              fontWeight: 400,
              lineHeight: '1.3',
              textAlign: 'center',
              maxWidth: '95%'
            }}
          >
            {hero.line3}
          </p>
        </div>
      </section>

      {/* Премиальный текстовый блок */}
      <section className="w-full bg-white py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <p 
              className="text-sm sm:text-base md:text-lg leading-relaxed text-center whitespace-pre-line"
              style={{
                fontFamily: 'var(--font-open-sans)',
                color: 'var(--color-classic-black)',
                fontWeight: 400,
                letterSpacing: '0.05em',
                lineHeight: '1.6',
              }}
            >
              {description.text}
            </p>
          </div>
        </div>
      </section>

      {/* Секция с sticky stacking панелями */}
      <section className="w-full bg-white py-8 sm:py-10 md:py-12 lg:py-16" style={{ overflow: 'visible' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Большой контейнер с красными границами - НЕ sticky, просто контейнер */}
          <div 
            ref={redContainerRef}
            className="max-w-[1600px] mx-auto bg-white"
            style={{
              paddingTop: '40px',
              paddingBottom: '40px',
              position: 'relative',
              minHeight: '250vh',
              overflow: 'visible',
            }}
          >
          {/* Первая панель - останавливается и больше не двигается */}
          <div style={{ height: '200vh', position: 'relative', overflow: 'visible' }}>
            <div
              ref={panel1Ref}
              className="sticky w-full aspect-[3/4] md:aspect-[16/9]"
              style={{
                top: `${headerHeight}px`,
                zIndex: 1,
              }}
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Фоновое изображение */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${panels[0]?.image || '/1.jpg'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                
                {/* Градиентный overlay для читаемости */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                  }}
                />
                
                {/* Дополнительное затемнение на мобильных */}
                <div 
                  className="absolute inset-0 bg-black/40 md:bg-transparent"
                />
                
                {/* Контент */}
                <div className="relative w-full h-full flex items-center justify-center md:justify-start p-6 sm:p-12 md:p-16 lg:p-20 xl:p-24">
                  <div className="max-w-2xl text-center md:text-left w-full px-4 md:px-0 md:ml-[8%]">
                    {/* Подзаголовок - мелко, вразрядку */}
                    <p
                      className="text-[10px] sm:text-xs md:text-sm mb-6 sm:mb-8 text-white/90"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        fontWeight: 300,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        lineHeight: '1.2',
                      }}
                    >
                      {panels[0]?.subtitle || 'ИСКУССТВО ПРЕЕМСТВЕННОСТИ'}
                    </p>
                    
                    {/* Заголовок - крупно, антиква */}
                    <h3 
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8 sm:mb-10 md:mb-12 text-white leading-[1.1] whitespace-pre-line"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        fontWeight: 400,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {panels[0]?.title || 'НАСЛЕДИЕ\nИ ВРЕМЯ'}
                    </h3>
                    
                    {/* Текст в кавычках */}
                    <div className="relative">
                      <p 
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 leading-relaxed md:pl-6 pl-0 md:border-l border-l-0"
                        style={{
                          fontFamily: 'var(--font-playfair-display)',
                          fontWeight: 300,
                          letterSpacing: '0.01em',
                          lineHeight: '1.7',
                          fontStyle: 'italic',
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {panels[0]?.quote || '«Мы работаем с объектами, которые не подвластны времени. Наша роль — обеспечить бесшовный переход ценности от одного поколения коллекционеров к другому».'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Вторая панель - поднимается и накладывается на первую */}
          <div style={{ height: '200vh', position: 'relative', overflow: 'visible' }} className="-mt-[250%] md:-mt-[56.25%]">
            <div
              ref={panel2Ref}
              className="sticky w-full aspect-[3/4] md:aspect-[16/9]"
              style={{
                top: `${headerHeight}px`,
                zIndex: 2,
              }}
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Фоновое изображение */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${panels[1]?.image || '/2.jpg'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                
                {/* Градиентный overlay для читаемости */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(225deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)',
                  }}
                />
                
                {/* Дополнительное затемнение на мобильных */}
                <div 
                  className="absolute inset-0 bg-black/40 md:bg-transparent"
                />
                
                {/* Контент - справа */}
                <div className="relative w-full h-full flex items-center justify-center md:justify-end p-6 sm:p-12 md:p-16 lg:p-20 xl:p-24">
                  <div className="max-w-2xl w-auto md:w-full px-4 md:px-0 mx-auto md:mx-0 md:mr-[8%]">
                    {/* Подзаголовок - мелко, вразрядку */}
                    <p
                      className="text-[10px] sm:text-xs md:text-sm mb-6 sm:mb-8 text-white/90 text-center md:text-right"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        fontWeight: 300,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        lineHeight: '1.2',
                      }}
                    >
                      {panels[1]?.subtitle || 'ЭКСПЕРТИЗА ВЫСШЕЙ ПРОБЫ'}
                    </p>
                    
                    {/* Заголовок - крупно, антиква */}
                    <h3 
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8 sm:mb-10 md:mb-12 text-white leading-[1.1] whitespace-pre-line text-center md:text-right"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        fontWeight: 400,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {panels[1]?.title || 'БЕЗУПРЕЧНЫЙ\nВЫБОР'}
                    </h3>
                    
                    {/* Текст в кавычках */}
                    <div className="relative">
                      <p 
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 leading-relaxed text-center md:text-right md:pr-6 pr-0 md:border-r border-r-0"
                        style={{
                          fontFamily: 'var(--font-playfair-display)',
                          fontWeight: 300,
                          letterSpacing: '0.01em',
                          lineHeight: '1.7',
                          fontStyle: 'italic',
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        {panels[1]?.quote || '«Каждый лот в нашей коллекции проходит многоуровневую аутентификацию. Мы определяем вершину того, что может предложить рынок частных активов».'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Третья панель - поднимается и накладывается на вторую */}
          <div style={{ height: '100vh', position: 'relative', overflow: 'visible' }} className="-mt-[250%] md:-mt-[56.25%]">
            <div
              ref={panel3Ref}
              className="sticky w-full aspect-[3/4] md:aspect-[16/9]"
              style={{
                top: `${headerHeight}px`,
                zIndex: 3,
              }}
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Фоновое изображение */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url(${panels[2]?.image || '/3.jpg'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                
                {/* Градиентный overlay для читаемости */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.35) 100%)',
                  }}
                />
                
                {/* Дополнительное затемнение на мобильных */}
                <div 
                  className="absolute inset-0 bg-black/40 md:bg-transparent"
                />
                
                {/* Контент - по центру, но с премиальной типографикой */}
                <div className="relative w-full h-full flex items-center justify-center p-12 sm:p-16 md:p-20 lg:p-24">
                  <div className="max-w-3xl text-center">
                    {/* Подзаголовок - мелко, вразрядку */}
                    <p
                      className="text-[10px] sm:text-xs md:text-sm mb-6 sm:mb-8 text-white/90"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        fontWeight: 300,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        lineHeight: '1.2',
                      }}
                    >
                      {panels[2]?.subtitle || 'ВНЕ ПУБЛИЧНОГО ПОЛЯ'}
                    </p>
                    
                    {/* Заголовок - крупно, антиква */}
                    <h3 
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8 sm:mb-10 md:mb-12 text-white leading-[1.1] whitespace-pre-line"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        fontWeight: 400,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {panels[2]?.title || 'ПРИВАТНЫЙ\nДОСТУП'}
                    </h3>
                    
                    {/* Текст в кавычках */}
                    <div className="relative max-w-2xl mx-auto">
                      <p 
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 leading-relaxed"
                        style={{
                          fontFamily: 'var(--font-playfair-display)',
                          fontWeight: 300,
                          letterSpacing: '0.01em',
                          lineHeight: '1.7',
                          fontStyle: 'italic',
                          paddingLeft: '1.5rem',
                          paddingRight: '1.5rem',
                          borderLeft: '1px solid rgba(255,255,255,0.3)',
                          borderRight: '1px solid rgba(255,255,255,0.3)',
                        }}
                      >
                        {panels[2]?.quote || '«Для особых случаев мы предлагаем формат частных продаж. Конфиденциальное сопровождение сделок и доступ к закрытым коллекциям, которые никогда не появятся в открытых каталогах».'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Текущие Аукционы - Премиум стиль Loro Piana */}
      <section className="w-full bg-white py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок секции - маленький, аккуратный */}
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
              Текущие Аукционы
            </h2>
          </div>

          {/* Сетка карточек - премиум стиль, 2 колонки на мобильных, 4 колонки на больших экранах */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 max-w-[1600px] mx-auto">
            {auctionsLoading ? (
              // Показываем плейсхолдеры во время загрузки
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="aspect-[3/4] bg-gray-100 animate-pulse"></div>
              ))
            ) : (
              currentAuctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  id={auction.id.toString()}
                  name={auction.name}
                  additionalInfo={auction.additional_info}
                  startingPrice={auction.starting_price}
                  auctionDates={auction.auction_dates}
                  images={auction.images || []}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Категории - Премиум стиль */}
      <section className="w-full bg-white py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Заголовок секции - маленький, аккуратный */}
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
                Категории
              </h2>
            </div>

            {/* Сетка из 3 категорий */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              {categories.slice(0, 3).map((category, index) => (
                <Link
                  key={category.category_id || index}
                  href={category.href}
                  className="group block"
                >
                  {/* Изображение */}
                  <div
                    className="w-full aspect-[4/5] mb-4 overflow-hidden relative"
                  >
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Текст */}
                  <div className="text-center">
                    {/* Маленький текст сверху */}
                    <p
                      className="text-[10px] sm:text-xs mb-2 uppercase tracking-widest"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: '#666666',
                        letterSpacing: '0.2em',
                      }}
                    >
                      {category.season}
                    </p>
                    
                    {/* Название категории с эффектом */}
                    <h3
                      className="text-base sm:text-lg md:text-xl relative inline-block cursor-pointer group"
                      style={{
                        fontFamily: 'var(--font-playfair-display)',
                        color: '#000000',
                        fontWeight: 400,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {/* Дефисы по бокам - уменьшаются, край у текста остается на месте */}
                      <span className="inline-block origin-right scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out">– </span>
                      <span>{category.title}</span>
                      <span className="inline-block origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out"> –</span>
                      
                      {/* Линия под текстом - появляется при наведении на текст */}
                      <span 
                        className="absolute bottom-0 left-0 right-0 h-px bg-black origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-in-out"
                      />
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Блок с текстом и изображениями - Премиум стиль */}
      <section className="w-full bg-white py-16 sm:py-20 md:py-24 lg:py-32">
        {/* Большое изображение на мобильных - на всю ширину экрана */}
        <Link href="/auctions" className="lg:hidden w-full aspect-[3/4] overflow-hidden block mb-6">
          <img
            src={textImage.bigImage}
            alt={textImage.title}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            {/* На мобильных: flex column, на десктопе: grid */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-0">
            {/* Большое изображение для десктопа - на десктопе вторым */}
            <Link href="/auctions" className="hidden lg:block w-full aspect-[3/4] lg:max-h-[80vh] lg:aspect-[3/4] overflow-hidden order-2">
              <img
                src={textImage.bigImage}
                alt={textImage.title}
                className="w-full h-full object-cover"
              />
            </Link>

            {/* На мобильных: маленькое фото отдельно */}
            <div className="lg:hidden order-2 mb-6 flex justify-center">
              <div className="w-full max-w-[200px] aspect-[3/4] overflow-hidden">
                <img
                  src={textImage.smallImage}
                  alt={textImage.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* На мобильных: текст отдельно */}
            <div className="lg:hidden order-3 text-center mb-6">
              <h2
                className="text-base sm:text-lg mb-4 whitespace-pre-line"
                style={{
                  fontFamily: 'var(--font-playfair-display)',
                  color: '#000000',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  lineHeight: '1.3',
                }}
              >
                {textImage.title}
              </h2>
              <p
                className="text-xs sm:text-sm mb-6 leading-relaxed max-w-md mx-auto"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#666666',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: '1.6',
                }}
              >
                {textImage.text}
              </p>
            </div>

            {/* Левая часть для десктопа - общая панель с бежевым фоном */}
            <Link href="/auctions" className="hidden lg:flex flex-col items-center justify-center py-8 sm:py-10 md:py-12 pr-8 sm:pr-12 md:pr-16 order-1" style={{ backgroundColor: '#faf9f7' }}>
              {/* Маленькое изображение */}
              <div className="w-full max-w-[200px] mx-auto aspect-[3/4] mb-6 sm:mb-8 overflow-hidden">
                <img
                  src={textImage.smallImage}
                  alt={textImage.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Текст */}
              <div className="text-center">
                <h2
                  className="text-base sm:text-lg md:text-xl mb-4 sm:mb-5 whitespace-pre-line"
                  style={{
                    fontFamily: 'var(--font-playfair-display)',
                    color: '#000000',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                    lineHeight: '1.3',
                  }}
                >
                  {textImage.title}
                </h2>
                <p
                  className="text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed max-w-md mx-auto"
                  style={{
                    fontFamily: 'var(--font-open-sans)',
                    color: '#666666',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    lineHeight: '1.6',
                  }}
                >
                  {textImage.text}
                </p>
                  
                  {/* Кнопка "Посмотреть" */}
                  <div className="text-sm sm:text-base relative inline-block cursor-pointer group"
                    style={{
                      fontFamily: 'var(--font-playfair-display)',
                      color: '#000000',
                      fontWeight: 400,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {/* Дефисы по бокам - уменьшаются, край у текста остается на месте */}
                    <span className="inline-block origin-right scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out">– </span>
                    <span>Посмотреть</span>
                    <span className="inline-block origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out"> –</span>
                    
                    {/* Линия под текстом - появляется при наведении на текст */}
                    <span 
                      className="absolute bottom-0 left-0 right-0 h-px bg-black origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-in-out"
                    />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Блок с текстом сверху и большим изображением - Премиум стиль */}
      <section className="w-full bg-white py-12 sm:py-16 md:py-20">
        {/* Изображение на мобильных - на всю ширину экрана */}
        <div className="lg:hidden w-full aspect-[3/4] overflow-hidden mb-6">
          <img
            src={imperial.image}
            alt={imperial.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1600px] mx-auto">
            {/* Текст - на мобильных под изображением, на десктопе сверху */}
            <div className="text-center mb-8 sm:mb-10 max-w-4xl mx-auto">
              <h2
                className="text-lg sm:text-xl md:text-2xl mb-4 sm:mb-5"
                style={{
                  fontFamily: 'var(--font-playfair-display)',
                  color: '#000000',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  lineHeight: '1.3',
                }}
              >
                {imperial.title}
              </h2>
              <p
                className="text-xs sm:text-sm leading-relaxed"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#666666',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: '1.6',
                }}
              >
                {imperial.text}
              </p>
            </div>

            {/* Изображение для десктопа */}
            <div className="hidden lg:block w-full max-w-xl mx-auto pb-6 sm:pb-8 md:pb-10">
              <div className="relative w-full aspect-[3/4] max-h-[80vh] overflow-hidden">
                <img
                  src={imperial.image}
                  alt={imperial.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Белая панель с кнопкой - наполовину на изображении */}
                <div className="absolute -bottom-6 sm:-bottom-8 md:-bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-8 sm:px-10 md:px-12 pt-2 sm:pt-3 md:pt-4 pb-8 sm:pb-10 md:pb-12 z-10 flex justify-center items-start" style={{ minHeight: '80px' }}>
                <Link
                  href="/auctions"
                  className="text-sm sm:text-base relative inline-block cursor-pointer group"
                  style={{
                    fontFamily: 'var(--font-playfair-display)',
                    color: '#000000',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  {/* Дефисы по бокам - уменьшаются, край у текста остается на месте */}
                  <span className="inline-block origin-right scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out">– </span>
                  <span>Посмотреть</span>
                  <span className="inline-block origin-left scale-x-100 group-hover:scale-x-0 transition-transform duration-700 ease-in-out"> –</span>
                  
                  {/* Линия под текстом - появляется при наведении на текст */}
                  <span 
                    className="absolute bottom-0 left-0 right-0 h-px bg-black origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-in-out"
                  />
                </Link>
              </div>
              </div>
            </div>
          </div>
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

