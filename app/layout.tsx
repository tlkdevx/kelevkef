// Файл: app/layout.tsx
import './globals.css';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

export const metadata = {
  title: 'KelevKef',
  description: 'Сервис по прогулке с питомцами',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="flex flex-col min-h-screen bg-gray-50">
        {/* Хедер */}
        <Header />

        {/* Основной контент страницы */}
        <main className="flex-grow">{children}</main>

        {/* Футер */}
        <Footer />
      </body>
    </html>
  );
}
