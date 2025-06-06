// components/Avatar.tsx
'use client';

import React from 'react';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number; // размер в пикселях (ширина/высота)
}

export default function Avatar({ url, name, size = 40 }: AvatarProps) {
  // Если есть URL, показываем <img>. Иначе – круг с первой буквой имени.
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  // Рисуем круг произвольного фона (например, с генерацией цвета по первой букве? 
  // Для простоты – статический серый фон)
  return (
    <div
      className="rounded-full bg-gray-400 flex items-center justify-center text-white font-medium"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
