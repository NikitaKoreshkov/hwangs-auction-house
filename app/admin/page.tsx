'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию через cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          router.push('/admin/login');
        }
      } catch (error) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p
          style={{
            fontFamily: 'var(--font-open-sans)',
            color: '#666666',
          }}
        >
          Загрузка...
        </p>
      </div>
    );
  }

  const sections = [
    {
      title: 'Редактировать сайт',
      items: [
        { label: 'Основная страница', href: '/admin/edit/homepage' },
        { label: 'О нас', href: '/admin/edit/about' },
        { label: 'Документы', href: '/admin/edit/documents' },
        { label: 'Аукционы', href: '/admin/edit/auctions' },
        { label: 'Фильтры', href: '/admin/edit/filters' },
      ],
    },
    {
      title: 'Обратная связь',
      items: [{ label: 'Просмотр заявок', href: '/admin/contact-requests' }],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Шапка */}
      <header className="border-b border-gray-200 py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div>
            <h1
              className="text-2xl mb-1"
              style={{
                fontFamily: 'var(--font-playfair-display)',
                color: '#000000',
                letterSpacing: '0.02em',
              }}
            >
              HWANG&apos;S
            </h1>
            <p
              className="text-sm"
              style={{
                fontFamily: 'var(--font-open-sans)',
                color: '#666666',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Панель администратора
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 border border-black hover:bg-black hover:text-white transition-colors"
            style={{
              fontFamily: 'var(--font-open-sans)',
              letterSpacing: '0.05em',
              fontSize: '14px',
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Контент */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section) => (
              <div
                key={section.title}
                className="border border-gray-200 p-8"
              >
                <h2
                  className="text-xl mb-6"
                  style={{
                    fontFamily: 'var(--font-playfair-display)',
                    color: '#000000',
                    letterSpacing: '0.01em',
                  }}
                >
                  {section.title}
                </h2>
                <ul className="space-y-4">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-3 px-4 border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors"
                        style={{
                          fontFamily: 'var(--font-open-sans)',
                          fontSize: '14px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

