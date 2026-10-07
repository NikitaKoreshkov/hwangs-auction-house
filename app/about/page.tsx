'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [headerHeight, setHeaderHeight] = useState(120);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Состояния для контента из БД
  const [hero, setHero] = useState({
    image: '/1.jpg',
    subtitle: 'Est. 2018',
    title: 'Искусство\nэксклюзивных\nколлекций',
    description: 'Hwang\'s — первый в России аукционный дом, чья экспертиза определяет вершину частных коллекций и активов. Мы создаем пространство, где встречаются истинные ценители прекрасного и уникальные произведения искусства.',
  });

  const [philosophy, setPhilosophy] = useState({
    title: 'Наша философия',
    quote: '«Мы не просто продаем предметы роскоши.\nМы создаем наследие и сохраняем культурную ценность\nдля будущих поколений коллекционеров»',
    author: 'Основатель Hwang\'s',
  });

  const [valuesSection, setValuesSection] = useState({
    title: 'Наши ценности',
    subtitle: 'Принципы,\nкоторыми мы живем',
    image: '/2.jpg',
    values: [
      {
        title: 'Эксклюзивность',
        description: 'Каждый лот в нашей коллекции — уникальное произведение искусства или предмет роскоши, тщательно отобранный нашими экспертами.',
        icon: '✦'
      },
      {
        title: 'Конфиденциальность',
        description: 'Мы гарантируем полную анонимность наших клиентов и сохранность информации о всех сделках.',
        icon: '◆'
      },
      {
        title: 'Экспертиза',
        description: 'Многоуровневая аутентификация и оценка каждого лота ведущими специалистами мирового уровня.',
        icon: '✧'
      },
      {
        title: 'Наследие',
        description: 'Мы работаем с объектами, которые не подвластны времени, обеспечивая их переход от поколения к поколению.',
        icon: '◈'
      },
    ],
  });

  // Загрузка контента из БД
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content/about');
        const data = await response.json();
        
        if (data.hero) setHero(data.hero);
        if (data.philosophy) setPhilosophy(data.philosophy);
        if (data.values) setValuesSection(data.values);
      } catch (error) {
        console.error('Ошибка загрузки контента:', error);
      }
    };

    fetchContent();
  }, []);

  // Получение высоты хедера
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    setTimeout(updateHeaderHeight, 100);

    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Отслеживание прогресса скролла для параллакс эффекта
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full bg-white">
      {/* Hero секция с параллакс эффектом */}
      <section 
        className="relative w-full overflow-hidden"
        style={{ 
          marginTop: `${headerHeight}px`,
          minHeight: '100vh',
        }}
      >
        {/* Фоновое изображение с параллаксом */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${hero.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${scrollProgress * 50}px) scale(${1 + scrollProgress * 0.1})`,
            transition: 'transform 0.1s ease-out',
          }}
        />
        
        {/* Градиентный overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
          }}
        />

        {/* Контент */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 text-center">
          {/* Маленький заголовок сверху */}
          <p
            className="text-xs sm:text-sm mb-8 sm:mb-12 text-white/80 uppercase tracking-[0.3em]"
            style={{
              fontFamily: 'var(--font-open-sans)',
              fontWeight: 300,
            }}
          >
            {hero.subtitle}
          </p>

          {/* Главный заголовок */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-8 sm:mb-12 text-white max-w-5xl leading-[0.95] whitespace-pre-line"
            style={{
              fontFamily: 'var(--font-playfair-display)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            {hero.title}
          </h1>

          {/* Описание */}
          <p
            className="text-base sm:text-lg md:text-xl max-w-3xl mb-12 sm:mb-16 text-white/90 leading-relaxed"
            style={{
              fontFamily: 'var(--font-open-sans)',
              fontWeight: 300,
              letterSpacing: '0.02em',
              lineHeight: '1.8',
            }}
          >
            {hero.description}
          </p>

          {/* Стрелка вниз */}
          <div 
            className="absolute bottom-12 animate-bounce"
            style={{
              opacity: 1 - scrollProgress * 3,
              transition: 'opacity 0.3s ease-out',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="7 13 12 18 17 13"></polyline>
              <polyline points="7 6 12 11 17 6"></polyline>
            </svg>
          </div>
        </div>
      </section>

      {/* Манифест секция */}
      <section className="w-full bg-white py-20 sm:py-24 md:py-32 lg:py-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p
              className="text-xs sm:text-sm mb-6 sm:mb-8 uppercase tracking-[0.3em] text-gray-500"
              style={{
                fontFamily: 'var(--font-open-sans)',
                fontWeight: 400,
              }}
            >
              {philosophy.title}
            </p>
            
            <blockquote
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.4] mb-8 sm:mb-12 whitespace-pre-line"
              style={{
                fontFamily: 'var(--font-playfair-display)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: '#000000',
                letterSpacing: '0.01em',
              }}
            >
              {philosophy.quote}
            </blockquote>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-gray-300 w-12"></div>
              <p
                className="text-sm uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  color: '#666666',
                  letterSpacing: '0.15em',
                }}
              >
                {philosophy.author}
              </p>
              <div className="h-px bg-gray-300 w-12"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Ценности с изображением */}
      <section className="w-full bg-white py-0">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Левая часть - изображение */}
            <div 
              className="relative w-full aspect-[4/5] lg:aspect-auto lg:min-h-[800px]"
              style={{
                backgroundImage: `url(${valuesSection.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Правая часть - ценности */}
            <div className="bg-[#faf9f7] p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center">
              <p
                className="text-xs sm:text-sm mb-6 uppercase tracking-[0.3em] text-gray-500"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  fontWeight: 400,
                }}
              >
                {valuesSection.title}
              </p>

              <h2
                className="text-3xl sm:text-4xl md:text-5xl mb-12 sm:mb-16 whitespace-pre-line"
                style={{
                  fontFamily: 'var(--font-playfair-display)',
                  fontWeight: 400,
                  color: '#000000',
                  letterSpacing: '0.01em',
                  lineHeight: '1.2',
                }}
              >
                {valuesSection.subtitle}
              </h2>

              <div className="space-y-10 sm:space-y-12">
                {valuesSection.values.map((value, index) => (
                  <div key={index} className="group">
                    <div className="flex items-start gap-4 mb-3">
                      <span
                        className="text-2xl transition-transform duration-500 group-hover:scale-125"
                        style={{
                          color: '#5c1a1a',
                        }}
                      >
                        {value.icon}
                      </span>
                      <h3
                        className="text-xl sm:text-2xl"
                        style={{
                          fontFamily: 'var(--font-playfair-display)',
                          fontWeight: 400,
                          color: '#000000',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {value.title}
                      </h3>
                    </div>
                    <p
                      className="text-sm sm:text-base pl-12"
                      style={{
                        fontFamily: 'var(--font-open-sans)',
                        color: '#666666',
                        letterSpacing: '0.02em',
                        lineHeight: '1.7',
                      }}
                    >
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      <section className="w-full flex flex-col items-center bg-white py-12 sm:py-16 md:py-20">
        <div className="w-[80%] bg-[#5c1a1a] py-12 sm:py-14 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-2xl mx-auto">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl mb-6 sm:mb-8 text-white"
              style={{
                fontFamily: 'var(--font-playfair-display)',
                fontWeight: 400,
                letterSpacing: '0.01em',
                lineHeight: '1.2',
              }}
            >
              Станьте частью нашей истории
            </h2>

            <p
              className="text-sm sm:text-base mb-8 sm:mb-10 text-white/80 leading-relaxed max-w-xl mx-auto"
              style={{
                fontFamily: 'var(--font-open-sans)',
                fontWeight: 300,
                letterSpacing: '0.02em',
                lineHeight: '1.7',
              }}
            >
              Присоединяйтесь к избранному кругу коллекционеров
            </p>

            <Link
              href="/auctions"
              className="inline-flex items-center gap-3 px-8 py-3 bg-white text-black hover:bg-gray-100 transition-colors duration-300 group"
              style={{
                fontFamily: 'var(--font-open-sans)',
                fontSize: '13px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              <span>Посмотреть аукционы</span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Добавляем keyframes для анимации */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

