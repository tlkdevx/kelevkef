// Файл: app/layout.tsx
import './globals.css';
import Header from '@/components/Header';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'KelevKef',
  description: 'Сервис поиска исполнителей для прогулки с собаками',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-100">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
