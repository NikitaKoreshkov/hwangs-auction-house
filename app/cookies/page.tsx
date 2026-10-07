'use client';

import { useState } from 'react';

const sections = [
  { id: 'introduction', title: 'Введение' },
  { id: 'what-are', title: 'Что такое файлы cookie' },
  { id: 'types', title: 'Какие файлы cookie мы используем' },
  { id: 'duration', title: 'Срок действия' },
  { id: 'third-party', title: 'Файлы cookie третьих сторон' },
  { id: 'management', title: 'Как управлять файлами cookie' },
  { id: 'similar', title: 'Аналогичные технологии' },
  { id: 'changes', title: 'Изменения в Политике' },
  { id: 'contacts', title: 'Контактная информация' },
];

export default function Cookies() {
  const [selectedSection, setSelectedSection] = useState('introduction');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const renderContent = () => {
    switch (selectedSection) {
      case 'introduction':
        return (
          <div className="space-y-4">
            <p>
              Настоящая Политика использования файлов Cookie (далее — «Политика») описывает, как <strong>Hwang&apos;s S.P.A</strong> (далее — «Компания», «мы», «нас») использует файлы cookie и аналогичные технологии на веб-сайте <strong>Hwang&apos;s</strong> (далее — «Сайт»), расположенном по адресу: <strong>[укажите доменное имя]</strong>.
            </p>
            <p>
              Используя Сайт, вы соглашаетесь с использованием файлов cookie в соответствии с настоящей Политикой. Если вы не согласны с использованием файлов cookie, пожалуйста, настройте параметры вашего браузера соответствующим образом или прекратите использование Сайта.
            </p>
          </div>
        );
      case 'what-are':
        return (
          <div className="space-y-4">
            <p>
              Файлы cookie — это небольшие текстовые файлы, которые веб-сайт сохраняет на устройстве пользователя (компьютере, планшете, смартфоне) при посещении сайта. Файлы cookie позволяют веб-сайту запоминать информацию о действиях и предпочтениях пользователя, что делает использование сайта более удобным и персонализированным.
            </p>
            <p>
              Файлы cookie обычно содержат:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Название веб-сайта, который их создал;</li>
              <li>Срок действия файла cookie;</li>
              <li>Уникальный идентификатор (обычно случайное число или строка);</li>
              <li>Значение (информацию, которую веб-сайт хочет сохранить).</li>
            </ul>
            <p>
              Файлы cookie не могут содержать вирусы или вредоносное программное обеспечение и не могут получить доступ к информации, хранящейся на вашем устройстве, за исключением той информации, которую вы сами предоставляете веб-сайту.
            </p>
          </div>
        );
      case 'types':
        return (
          <div className="space-y-4">
            <div>
              <p><strong>Строго необходимые файлы cookie</strong></p>
              <p className="ml-4">Эти файлы cookie необходимы для корректной работы Сайта и его основных функций. Без них некоторые функции Сайта могут быть недоступны. Они используются для сохранения информации о сессии пользователя, обеспечения безопасности при работе с формами, запоминания выбранного языка интерфейса и сохранения настроек пользователя. Эти файлы cookie не требуют вашего согласия и не могут быть отключены в настройках Сайта.</p>
            </div>
            <div>
              <p><strong>Функциональные файлы cookie</strong></p>
              <p className="ml-4">Эти файлы cookie позволяют Сайту запоминать выборы и предпочтения пользователя, что делает использование Сайта более удобным и персонализированным. Они используются для запоминания предпочтений пользователя (например, размер шрифта, цветовая схема), сохранения информации о ранее просмотренных страницах, запоминания выбранных фильтров при просмотре каталога лотов, сохранения состояния форм при заполнении.</p>
            </div>
            <div>
              <p><strong>Аналитические файлы cookie</strong></p>
              <p className="ml-4">Эти файлы cookie помогают нам понять, как пользователи взаимодействуют с Сайтом, собирая анонимную статистику о посещениях, просмотренных страницах, времени, проведенном на Сайте, и источниках перехода на Сайт. Собранная информация используется исключительно в агрегированном и анонимном виде для улучшения работы Сайта и пользовательского опыта.</p>
            </div>
            <div>
              <p><strong>Рекламные файлы cookie</strong></p>
              <p className="ml-4">В настоящее время Компания не использует рекламные файлы cookie для показа таргетированной рекламы. Если в будущем мы начнем использовать такие файлы cookie, мы обновим настоящую Политику и уведомим пользователей.</p>
            </div>
          </div>
        );
      case 'duration':
        return (
          <div className="space-y-4">
            <p>Мы используем два типа файлов cookie по сроку действия:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Сессионные файлы cookie:</strong> временные файлы cookie, которые удаляются автоматически при закрытии браузера. Они необходимы для обеспечения работы Сайта во время вашего посещения.
              </li>
              <li>
                <strong>Постоянные файлы cookie:</strong> остаются на вашем устройстве в течение определенного периода времени (обычно от нескольких дней до нескольких лет) или до тех пор, пока вы их не удалите вручную. Они позволяют Сайту запоминать ваши предпочтения при последующих посещениях.
              </li>
            </ul>
            <p>Срок действия постоянных файлов cookie устанавливается в зависимости от их назначения и обычно не превышает 12 (двенадцати) месяцев.</p>
          </div>
        );
      case 'third-party':
        return (
          <div className="space-y-4">
            <p>На Сайте могут использоваться файлы cookie третьих сторон, например, сервисов аналитики или других инструментов, которые помогают нам улучшать работу Сайта.</p>
            <p>Использование файлов cookie третьих сторон регулируется политиками конфиденциальности соответствующих третьих сторон. Мы не контролируем и не несем ответственности за использование файлов cookie третьими сторонами.</p>
            <p>Если на Сайте используются сервисы третьих сторон (например, Google Analytics, Яндекс.Метрика), мы рекомендуем вам ознакомиться с их политиками использования файлов cookie:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google Analytics: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://policies.google.com/privacy</a></li>
              <li>Яндекс.Метрика: <a href="https://yandex.ru/legal/confidential" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://yandex.ru/legal/confidential</a></li>
            </ul>
          </div>
        );
      case 'management':
        return (
          <div className="space-y-4">
            <p>Вы можете управлять файлами cookie и контролировать их использование следующими способами:</p>
            <div>
              <p><strong>Настройки браузера</strong></p>
              <p className="ml-4">Большинство браузеров позволяют управлять файлами cookie через настройки. Вы можете блокировать все файлы cookie, разрешать только файлы cookie с определенных сайтов, удалять все или выборочно удалять файлы cookie, настроить автоматическое удаление файлов cookie при закрытии браузера, получать уведомления перед сохранением файлов cookie.</p>
              <p className="ml-4 mt-2">Инструкции по настройке файлов cookie для популярных браузеров:</p>
              <ul className="list-disc pl-10 space-y-1">
                <li>Google Chrome: Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов</li>
                <li>Mozilla Firefox: Настройки → Приватность и защита → Файлы cookie и данные сайтов</li>
                <li>Safari: Настройки → Конфиденциальность → Управление данными веб-сайтов</li>
                <li>Microsoft Edge: Настройки → Файлы cookie и разрешения сайтов → Файлы cookie и данные сайтов</li>
                <li>Opera: Настройки → Конфиденциальность и безопасность → Файлы cookie и другие данные сайтов</li>
              </ul>
            </div>
            <div>
              <p><strong>Важные замечания</strong></p>
              <p className="ml-4">Обратите внимание, что блокировка или удаление файлов cookie может повлиять на функциональность Сайта: некоторые функции Сайта могут быть недоступны, вам может потребоваться повторно вводить информацию при каждом посещении, ваши предпочтения и настройки могут не сохраняться, некоторые страницы могут загружаться медленнее или работать некорректно.</p>
            </div>
          </div>
        );
      case 'similar':
        return (
          <div className="space-y-4">
            <p>Помимо файлов cookie, мы можем использовать аналогичные технологии для сбора информации о вашем использовании Сайта:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Локальное хранилище (Local Storage):</strong> технология, позволяющая сохранять данные в браузере на более длительный срок, чем файлы cookie;
              </li>
              <li>
                <strong>Сессионное хранилище (Session Storage):</strong> технология, позволяющая сохранять данные только на время сессии браузера;
              </li>
              <li>
                <strong>Пиксельные теги (Pixel Tags):</strong> небольшие невидимые изображения, используемые для отслеживания активности пользователей;
              </li>
              <li>
                <strong>Веб-маяки (Web Beacons):</strong> небольшие фрагменты кода, используемые для сбора информации о посещениях страниц.
              </li>
            </ul>
            <p>Положения настоящей Политики распространяются на все аналогичные технологии, используемые на Сайте.</p>
          </div>
        );
      case 'changes':
        return (
          <div className="space-y-4">
            <p>Компания оставляет за собой право вносить изменения в настоящую Политику в любое время. Изменения вступают в силу с момента их размещения на Сайте с указанием даты последнего обновления.</p>
            <p>Рекомендуем периодически просматривать настоящую Политику, чтобы быть в курсе любых изменений в использовании файлов cookie.</p>
            <p>Продолжение использования Сайта после внесения изменений в настоящую Политику означает ваше согласие с такими изменениями.</p>
          </div>
        );
      case 'contacts':
        return (
          <div className="space-y-4">
            <p>По всем вопросам, связанным с использованием файлов cookie на Сайте, вы можете обращаться к Компании:</p>
            <div className="bg-gray-50 p-6 my-4 rounded">
              <p><strong>Hwang&apos;s S.P.A</strong></p>
              <p>ИНН: 01611400027</p>
              <p>Адрес: [укажите юридический адрес]</p>
              <p>Email: <a href="mailto:ceo@hwangs.ru" className="text-blue-600 underline">ceo@hwangs.ru</a></p>
              <p>Телефон: +74959432143</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white min-h-screen pt-48 pb-20" style={{ backgroundColor: '#faf9f7' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h1
            className="text-lg sm:text-xl mb-2"
            style={{
              fontFamily: 'var(--font-playfair-display)',
              color: 'var(--color-classic-black)',
              fontWeight: 400,
              letterSpacing: '0.01em',
              fontStyle: 'italic',
            }}
          >
            Политика использования файлов Cookie
          </h1>
          <p
            className="text-xs text-gray-600"
            style={{
              fontFamily: 'var(--font-open-sans)',
              letterSpacing: '0.02em',
            }}
          >
            Выберите раздел для просмотра информации
          </p>
        </div>

        {/* Разделительная линия */}
        <div className="border-t border-gray-200 mb-16"></div>

        {/* Основной контент - две колонки */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Левая колонка - навигация */}
          <div className="lg:col-span-2">
            <nav className="space-y-1">
              {sections.map((section) => {
                const isActive = selectedSection === section.id;
                const isHovered = hoveredSection === section.id;
                const shouldHighlight = isActive || isHovered;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    onMouseEnter={() => setHoveredSection(section.id)}
                    onMouseLeave={() => setHoveredSection(null)}
                    className="w-full text-left py-3 group relative"
                    style={{
                      fontFamily: 'var(--font-open-sans)',
                      fontSize: '15px',
                      letterSpacing: '0.02em',
                      color: shouldHighlight ? '#8B4513' : 'var(--color-classic-black)',
                      transition: 'color 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                    }}
                  >
                    <span className="relative">
                      {section.title}
                      <span
                        className="absolute bottom-0 left-0 right-0 h-px bg-current origin-left"
                        style={{
                          transform: shouldHighlight ? 'scaleX(1)' : 'scaleX(0)',
                          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Правая колонка - контент */}
          <div className="lg:col-span-3">
            <div
              key={selectedSection}
              className="space-y-4"
              style={{
                fontFamily: 'var(--font-open-sans)',
                color: 'var(--color-classic-black)',
                lineHeight: '1.9',
                fontSize: '16px',
                opacity: 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            >
              <h2
                className="mb-6"
                style={{
                  fontFamily: 'var(--font-open-sans)',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  fontSize: '14px',
                }}
              >
                {sections.find(s => s.id === selectedSection)?.title}
              </h2>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
