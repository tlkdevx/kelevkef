// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  // Стили кнопки, аналогичные тем, что используются в Header
  const buttonClass =
    'bg-blue-100 hover:bg-blue-200 text-gray-800 px-3 py-1 rounded transition';

  return (
    <footer className="bg-white shadow px-4 py-6"> {/* Сделали фон и тень, как в Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
        <p className="mb-2 sm:mb-0">
          © 2025 KelevKef. Все права почти защищены.
        </p>
        <Link href="/contacts" className={buttonClass}>
          Контакты
        </Link>
      </div>
    </footer>
  );
}
