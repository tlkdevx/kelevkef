# KelevKef

**KelevKef** — это современная платформа для поиска догситтеров (dog sitters) и управления услугами для владельцев питомцев. Проект построен на Next.js (App Router), Supabase и Tailwind CSS.

---

## Содержание

1. [Особенности проекта](#особенности-проекта)  
2. [Технологии](#технологии)  
3. [Структура репозитория](#структура-репозитория)  
4. [Установка и запуск локально](#установка-и-запуск-локально)  
   1. [Клонирование](#клонирование)  
   2. [Настройка окружения](#настройка-окружения)  
   3. [Создание проекта Supabase](#создание-проекта-supabase)  
   4. [Инициализация базы данных](#инициализация-базы-данных)  
   5. [Запуск](#запуск)  
5. [API и маршруты](#api-и-маршруты)  
6. [Схема базы данных](#схема-базы-данных)  
7. [Хранение файлов (Storage)](#хранение-файлов-storage)  
   1. [Создание бакетов](#создание-бакетов)  
   2. [Политики доступа (RLS)](#политики-доступа-rls)  
8. [Стиль и Tailwind](#стиль-и-tailwind)  
9. [Деплой](#деплой)  
10. [Удаление Dev Overlay Next.js](#удаление-dev-overlay-nextjs)  
11. [Контакты](#контакты)  
12. [Лицензия](#лицензия)  

---

## Особенности проекта

- **Регистрация и аутентификация** пользователей через Supabase Auth.  
- **Профили пользователей** (догситтеры и владельцы).  
- **Поиск исполнителей** (догситтеров) с отображением на карте (Leaflet + OpenStreetMap).  
- **Создание заказов**: пользователь-клиент может заказать услугу у исполнителя (догситтера), указав дату, адрес, питомца, тип услуги и детали.  
- **Управление заказами**:  
  - Исполнитель видит список заявок на своей «панели» (Dashboard), может подтвердить или отклонить заказ, открыть чат с клиентом, а также видеть свою историю доходов и статистику.  
  - Клиент видит свои активные заказы, может оценивать завершённые (звёздный рейтинг), а также просматривать историю расходов.  
- **Мои питомцы**: у каждого клиента есть «Питомцы» (кошки, собаки или другие), каждый питомец — отдельная карточка с фото, типом, описанием и возрастом. При создании заказа клиент выбирает одного из своих питомцев.  
- **Загрузка и хранение аватарок** (пользователей и питомцев) в Supabase Storage.  
- **HTTP API маршруты** (Next.js App Router) для операций CRUD: профили, заказы, чат, история и т.д.  
- **Чат в реальном времени** для общения клиента и исполнителя по каждому заказу.  
- **Адаптивный интерфейс** на Next.js + Tailwind CSS.  
- **Dark/Light mode** (автоматический выбор по системным настройкам).  

---

## Технологии

- **Фронтенд:**  
  – Next.js 15 (App Router, React Server Components + React Client Components)  
  – React 18 (хуки, динамический импорт)  
  – Tailwind CSS (утилитарные классы)  
  – Leaflet + react-leaflet (отображение карты с маркерами)  
  – TypeScript (опционально, при наличии `tsconfig.json` и типов)  

- **Бэкенд / База данных / Авторизация:**  
  – Supabase (PostgreSQL + Auth + Storage + Realtime + RLS)  
  – Supabase Client (`@supabase/supabase-js`)  
  – Next.js API Route Functions (Route Handlers)  

- **Хранение файлов:**  
  – Supabase Storage для аватарок пользователей и питомцев.  

- **Разработка и шаблоны:**  
  – ESLint (если настроено)  
  – Prettier (если настроено)  
  – Husky / Lint-staged (опционально)  

---

## Структура репозитория

/
├── app
│ ├── api
│ │ ├── create-profile/route.ts # POST: создание профиля
│ │ ├── create-order/route.ts # POST: создание заказа
│ │ ├── get-executor-orders/route.ts # GET: заказы для исполнителя
│ │ ├── executor/earnings/route.ts # GET: подсчет заработка исполнителя
│ │ ├── get-client-orders/route.ts # GET: заказы для клиента
│ │ ├── update-order-status/route.ts # PUT: обновление статуса заказа
│ │ ├── update-order-rating/route.ts # PUT: обновление рейтинга заказа
│ │ ├── get-chat-messages/route.ts # GET: сообщения чата по orderId
│ │ └── post-chat-message/route.ts # POST: создание сообщения чата
│ ├── dashboard
│ │ └── page.tsx # Страница «Кабинет» (Dashboard)
│ ├── search
│ │ ├── page.tsx # Страница поиска исполнителей
│ │ └── page.module.css # CSS-модули для поиска
│ ├── login
│ │ └── page.tsx # Страница входа (Supabase Auth)
│ ├── signup
│ │ └── page.tsx # Страница регистрации
│ ├── profile
│ │ ├── [id]
│ │ │ └── page.tsx # Страница просмотра профиля
│ │ └── edit
│ │ └── page.tsx # Страница редактирования своего профиля
│ ├── pets
│ │ ├── page.tsx # Страница «Мои питомцы» (список + добавление)
│ │ └── edit
│ │ └── [id]
│ │ └── page.tsx # Страница редактирования питомца
│ ├── orders
│ │ ├── page.tsx # Страница «Мои Заказы» для клиента
│ │ ├── client
│ │ │ └── page.tsx # (alias) та же страница /orders/page.tsx
│ │ └── create
│ │ └── page.tsx # Страница создания заказа
│ ├── history
│ │ ├── executed
│ │ │ └── page.tsx # История выполненных заказов (исполнитель)
│ │ └── spending
│ │ └── page.tsx # История совершённых заказов (клиент)
│ ├── contacts
│ │ └── page.tsx # Страница «Контакты»
│ ├── (layout).tsx # Главный layout (Header + Footer + <main>)
│ └── page.tsx # Главная страница (Landing)
│
├── components
│ ├── Header.tsx # Хедер (навигация + авторизация)
│ ├── Footer.tsx # Футер (контакты + копирайт)
│ ├── Avatar.tsx # Компонент «аватар»
│ └── … # Другие переиспользуемые компоненты
│
├── lib
│ ├── supabaseClient.ts # Инициализация Supabase Client (browser + server)
│ └── helpers.ts # Утилиты (работа с cookie, утилиты RSC и т.д.)
│
├── public
│ └── dog-logo.png # Логотип / изображения (favicon)
│
├── styles
│ ├── globals.css # Глобальные стили (Tailwind, Leaflet и т.д.)
│ └── … # Доп. CSS (модули)
│
├── next.config.js # Конфигурация Next.js
├── postcss.config.js # Конфигурация PostCSS (Tailwind)
├── tailwind.config.js # Конфигурация Tailwind
├── tsconfig.json (опционально) # Конфигурация TypeScript
├── package.json # Зависимости и скрипты
└── README.md # Этот файл

yaml
Копировать
Редактировать

---

## Установка и запуск локально

Следуйте этим шагам, чтобы запустить проект у себя на компьютере.

### 1. Клонирование

```powershell
git clone https://github.com/tlkdevx/kelevkef.git
cd kelevkef
2. Настройка окружения (.env.local)
В корне проекта создайте файл .env.local со следующим содержимым (пример):

dotenv
Копировать
Редактировать
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SUPABASE_URL — URL вашего проекта Supabase (Dashboard → Settings → API).

NEXT_PUBLIC_SUPABASE_ANON_KEY — Анонимный публичный ключ (Dashboard → Settings → API).

SUPABASE_SERVICE_ROLE_KEY — Секретный «service_role» ключ (Dashboard → Settings → API → Service Role Key).

Важно!

Никогда не выкладывайте .env.local в публичный репозиторий.

В продакшн среде используйте защищённые переменные окружения в вашей CI/CD или хостинг-платформе (Vercel, Netlify и т.д.).

3. Создание проекта Supabase
Зарегистрируйтесь на app.supabase.com и создайте новый проект.

В Dashboard → Settings → API скопируйте:

URL → NEXT_PUBLIC_SUPABASE_URL

Anon Key → NEXT_PUBLIC_SUPABASE_ANON_KEY

Service Role Key → SUPABASE_SERVICE_ROLE_KEY

4. Инициализация базы данных
В Dashboard Supabase откройте SQL Editor и запустите следующий SQL-код для создания таблиц и RLS-политик:

sql
Копировать
Редактировать
-- Таблица: profiles (профили пользователей)
create table if not exists profiles (
  id uuid generated by default as identity primary key,
  user_id uuid references auth.users on delete cascade,
  full_name text,
  city text,
  about text,
  price_per_walk numeric,
  latitude numeric,
  longitude numeric,
  avatar_url text,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Таблица: pets (питомцы)
create table if not exists pets (
  id uuid generated by default as identity primary key,
  owner_id uuid references auth.users on delete cascade,
  pet_type text not null,
  name text not null,
  age int not null,
  description text,
  avatar_url text,
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Таблица: orders (заказы)
create table if not exists orders (
  id uuid generated by default as identity primary key,
  client_id uuid references auth.users on delete cascade,
  executor_id uuid references auth.users on delete cascade,
  pet_id uuid references pets on delete set null,
  service_type text check (service_type in ('walk','sitting','play','transport')),
  date timestamptz not null,
  address text not null,
  details text,
  price numeric,
  status text default 'pending' check (status in ('pending','confirmed','declined')),
  rating numeric check (rating >= 1 and rating <= 5),
  inserted_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Таблица: order_messages (чат)
create table if not exists order_messages (
  id uuid generated by default as identity primary key,
  order_id uuid references orders on delete cascade,
  sender_id uuid references auth.users on delete cascade,
  message text not null,
  inserted_at timestamp with time zone default now()
);

-- Включаем RLS (Row Level Security) для каждой таблицы
alter table profiles enable row level security;
alter table pets enable row level security;
alter table orders enable row level security;
alter table order_messages enable row level security;

-- Политики для profiles
create policy "Profiles: allow only owner to update" 
  on profiles for update 
  using ( auth.uid() = user_id );
create policy "Profiles: select public" 
  on profiles for select 
  using (true);

-- Политики для pets
create policy "Pets: allow only owner to update/delete" 
  on pets for update, delete
  using ( auth.uid() = owner_id );
create policy "Pets: select public" 
  on pets for select 
  using (true);
create policy "Pets: insert owner is current user" 
  on pets for insert 
  with check ( auth.uid() = owner_id );

-- Политики для orders
create policy "Orders: insert by client" 
  on orders for insert 
  with check ( auth.uid() = client_id );
create policy "Orders: select for client or executor" 
  on orders for select 
  using ( auth.uid() = client_id or auth.uid() = executor_id );
create policy "Orders: update status by executor" 
  on orders for update 
  using ( auth.uid() = executor_id and new .status in ('confirmed','declined') );
create policy "Orders: rating by client" 
  on orders for update 
  using ( auth.uid() = client_id and old .status = 'confirmed' and new .rating is not null );

-- Политики для order_messages
create policy "Chat: send/receive only participants" 
  on order_messages for select, insert
  using (
    auth.uid() = (select client_id from orders where id = order_id)
    or
    auth.uid() = (select executor_id from orders where id = order_id)
  );
5. Запуск
powershell
Копировать
Редактировать
# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev
# → http://localhost:3000

# Для production
npm run build
npm run start
API и маршруты
app/api/create-profile/route.ts – POST: создать/обновить профиль.

app/api/create-order/route.ts – POST: создать заказ.

app/api/get-executor-orders/route.ts – GET: заказы, где текущий пользователь – исполнитель.

app/api/executor/earnings/route.ts – GET: сумма заработка исполнителя по подтверждённым заказам.

app/api/get-client-orders/route.ts – GET: заказы, где текущий пользователь – клиент.

app/api/update-order-status/route.ts – PUT: изменить статус заказа (confirmed/declined).

app/api/update-order-rating/route.ts – PUT: добавить рейтинг к заказу.

app/api/get-chat-messages/route.ts – GET: получить все сообщения чата по orderId.

app/api/post-chat-message/route.ts – POST: отправить сообщение в чат (order_messages).

Каждый роутер возвращает JSON и корректный HTTP код (200, 201, 401, 403, 500 и т.д.).

Схема базы данных
scss
Копировать
Редактировать
┌───────────────┐        ┌──────────────┐        ┌───────────────┐
│  auth.users   │◄────▶ │   profiles   │        │    pets       │
│ (id, email…)  │       │(user_id, …)  │◄───┐   │(owner_id, …)  │
└───────────────┘       └──────────────┘    │   └───────────────┘
                                            │
                                            ▼
                                          ┌───────────────┐      ┌─────────────────┐
                                          │    orders     │◄────▶│ order_messages │
                                          │(client_id,    │      │(order_id, …)    │
                                          │ executor_id,  │      └─────────────────┘
                                          │ pet_id, …)    │
                                          └───────────────┘
Хранение файлов (Storage)
1. Создание бакетов
В Supabase Console → Storage → Buckets создайте:

avatars – публичный бакет для аватарок пользователей.

pet-avatars – публичный бакет для фотографий питомцев.

Если вы используете Supabase CLI:

powershell
Копировать
Редактировать
supabase login
supabase init
supabase link --project-ref <your-project-ref>
supabase storage bucket create avatars
supabase storage bucket create pet-avatars
2. Политики доступа (RLS)
Чтобы ограничить доступ к файлам по владельцу, в SQL Editor Supabase выполните:

sql
Копировать
Редактировать
-- Включаем RLS для storage.objects
alter table storage.objects enable row level security;

-- Политика: пользователь может читать только свои файлы
create policy "Storage: read own files"
  on storage.objects
  for select
  using (
    bucket_id in ('avatars','pet-avatars')
    and owner() = auth.uid()
  );

create policy "Storage: insert own files"
  on storage.objects
  for insert
  with check (
    bucket_id in ('avatars','pet-avatars')
    and owner() = auth.uid()
  );

create policy "Storage: delete own files"
  on storage.objects
  for delete
  using ( owner() = auth.uid() );
Если выбран публичный доступ бакета (через Dashboard → Storage → Bucket Settings → Enable Public Access), RLS можно не настраивать.

Стиль и Tailwind
Проект использует Tailwind CSS.

tailwind.config.js настроен на сканирование всех файлов в app и components:

js
Копировать
Редактировать
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
В styles/globals.css подключены стили Leaflet и Tailwind:

css
Копировать
Редактировать
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
Деплой
Настройте переменные окружения в вашей платформе (Vercel, Netlify, Render и т.д.):

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

Push ветку в GitHub.

На Vercel создайте новый проект, укажите репозиторий, выберите «App Directory» (Next.js 15+).

В production-режиме Dev Overlay отсутствует.

Удаление Dev Overlay Next.js
Чтобы отключить Dev Overlay (черная кнопка «N») в режиме разработки:

js
Копировать
Редактировать
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactDevOverlay: false,
  },
};

module.exports = nextConfig;
После этого при npm run dev Overlay не будет отображаться.

Контакты
Email: support@kelevkef.example.com

Телефон (Израиль): +972-50-123-4567

Адрес: ул. Пёсиков, 42, Тель-Авив, Израиль

Соц. сети: Facebook • Instagram • LinkedIn

Лицензия
MIT License © 2025 KelevKef

sql
Копировать
Редактировать
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...