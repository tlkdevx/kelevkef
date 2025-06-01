import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Header from '../components/Header';

export const metadata: Metadata = {
  title: 'KelevKef',
  description: 'Сервис по выгулу и передержке собак в Израиле',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-100 min-h-screen text-gray-800">
        <Header />
        <main className="max-w-4xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
