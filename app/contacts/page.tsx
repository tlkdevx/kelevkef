'use client';

import Link from 'next/link';

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="bg-white max-w-md w-full p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Контакты</h1>
        <p className="mb-2">
          Если у вас возникли вопросы или предложения, свяжитесь с нами:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2">
          <li>
            Email: 
            <a
              href="mailto:support@kelevkef.co.il"
              className="text-blue-600 hover:underline ml-1"
            >
              support@kelevkef.co.il
            </a>
          </li>
          <li>
            Телефон: 
            <a
              href="tel:+972501234567"
              className="text-blue-600 hover:underline ml-1"
            >
              +972 50 123 4567
            </a>
          </li>
          <li>Наш офис: ул. Ротшильда, 12, Тель-Авив, Израиль</li>
          <li>WhatsApp: 
            <a
              href="https://wa.me/972501234567"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Написать в WhatsApp
            </a>
          </li>
        </ul>
        <Link href="/" className="text-blue-600 hover:underline">
          ← На главную
        </Link>
      </div>
    </div>
  );
}
