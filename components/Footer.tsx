// Файл: components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t px-4 py-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
        <p className="mb-2 sm:mb-0">
          © 2025 KelevKef. Все права защищены.
        </p>
        <Link
          href="/contacts"
          className="
            inline-block
            bg-blue-600 
            text-white 
            px-4 
            py-2 
            rounded-lg 
            hover:bg-blue-700 
            transition
            text-lg
          "
        >
          Контакты
        </Link>
      </div>
    </footer>
  );
}
