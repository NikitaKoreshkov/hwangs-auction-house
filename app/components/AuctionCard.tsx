'use client';

import Link from 'next/link';

interface AuctionCardProps {
  id: string;
  name: string;
  additionalInfo?: string;
  startingPrice: string;
  auctionDates?: string; // Срок проведения аукциона
  images?: string[];
  large?: boolean;
  small?: boolean;
}

export default function AuctionCard({ id, name, startingPrice, auctionDates, images = [], large = false, small = false }: AuctionCardProps) {
  // Если изображений нет, используем плейсхолдер
  const displayImage = images.length > 0 ? images[0] : null;

  return (
    <Link 
      href={`/auctions/${id}`}
      className="group block w-full"
    >
      <div className="w-full">
        {/* Контейнер изображения */}
        <div 
          className={`relative w-full overflow-hidden bg-white mb-4 md:mb-0 ${
            large ? 'aspect-[3/5]' : 
            'aspect-[3/4]'
          }`}
        >
          {/* Только первое изображение */}
          {displayImage ? (
            <img
              src={displayImage}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <div 
                className="text-gray-300 text-2xl tracking-wider"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  fontWeight: 300,
                  letterSpacing: '0.2em',
                }}
              >
                HWANG&apos;S
              </div>
            </div>
          )}
          
          {/* Панель с информацией для десктопа - появляется снизу при hover (50% ширины) */}
          <div className="hidden md:block absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out w-1/2 bg-white px-4 py-3 text-center">
            {/* Название */}
            <h3 
              className="mb-1 text-[13px] sm:text-[14px] leading-tight"
              style={{
                fontFamily: 'var(--font-playfair-display)',
                color: '#000000',
                fontWeight: 400,
                letterSpacing: '0.02em',
                lineHeight: '1.4',
              }}
            >
              {name}
            </h3>
            
            {/* Срок проведения аукциона */}
            {auctionDates && (
              <p 
                className="text-[11px] sm:text-[12px] mb-1.5"
                style={{
                  fontFamily: 'var(--font-playfair-display)',
                  color: '#696969',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  letterSpacing: '0.01em',
                  lineHeight: '1.3',
                }}
              >
                {auctionDates}
              </p>
            )}
            
            {/* Цена */}
            <p 
              className="text-[11px] sm:text-[12px]"
              style={{
                fontFamily: 'var(--font-open-sans)',
                color: '#696969',
                fontWeight: 400,
                letterSpacing: '0.05em',
                lineHeight: '1.5',
              }}
            >
              {startingPrice.startsWith('От') ? startingPrice : `От ${startingPrice}`}
            </p>
          </div>
        </div>
        
        {/* Текст под изображением - только на мобильных */}
        <div className="md:hidden text-center">
          {/* Название */}
          <h3 
            className="mb-2 text-sm leading-tight"
            style={{
              fontFamily: 'var(--font-playfair-display)',
              color: '#000000',
              fontWeight: 400,
              letterSpacing: '0.01em',
              lineHeight: '1.4',
            }}
          >
            {name}
          </h3>
          
          {/* Срок проведения аукциона */}
          {auctionDates && (
            <p 
              className="text-xs mb-2"
              style={{
                fontFamily: 'var(--font-playfair-display)',
                color: '#696969',
                fontWeight: 400,
                fontStyle: 'italic',
                letterSpacing: '0.01em',
                lineHeight: '1.4',
              }}
            >
              {auctionDates}
            </p>
          )}
          
          {/* Цена */}
          <p 
            className="text-xs"
            style={{
              fontFamily: 'var(--font-open-sans)',
              color: '#696969',
              fontWeight: 400,
              letterSpacing: '0.02em',
              lineHeight: '1.5',
            }}
          >
            {startingPrice.startsWith('От') ? startingPrice : `От ${startingPrice}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
