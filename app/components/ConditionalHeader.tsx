'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Не показываем Header на страницах админки
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  return <Header />;
}

