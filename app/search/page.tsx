// Файл: app/search/page.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './page.module.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function SearchPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCenter: [number, number] = [32.0853, 34.7818];
  const defaultZoom = 11;

  const markerIcon = new Icon({
    iconUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, city, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Ошибка при запросе профилей:', error);
        setError('Не удалось загрузить список исполнителей.');
        setLoading(false);
        return;
      }

      setProfiles(data as Profile[]);
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Поиск исполнителей</h1>

      {loading && <p className={styles.status}>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.contentWrapper}>
          <div className={styles.list}>
            {profiles.length === 0 && (
              <p className={styles.empty}>Нет доступных исполнителей.</p>
            )}
            {profiles.map((p) => (
              <div key={p.user_id} className={styles.card}>
                <div className={styles.cardHeader}>
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={p.full_name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {p.full_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.info}>
                    <p className={styles.name}>{p.full_name}</p>
                    <p className={styles.city}>
                      {p.city || 'Город не указан'}
                    </p>
                  </div>
                </div>
                <div className={styles.actions}>
                  <a href={`/profile/${p.user_id}`} className={styles.button}>
                    Профиль
                  </a>
                  <a
                    href={`/orders/create?executorId=${p.user_id}`}
                    className={`${styles.button} ${styles.primaryButton}`}
                  >
                    Заказать
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.mapWrapper}>
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {profiles.map((p) => {
                if (p.latitude !== null && p.longitude !== null) {
                  return (
                    <Marker
                      key={p.user_id}
                      position={[p.latitude, p.longitude]}
                      icon={markerIcon}
                    >
                      <Popup>
                        <div className={styles.popup}>
                          <p className={styles.popupName}>{p.full_name}</p>
                          <p className={styles.popupCity}>
                            {p.city || 'Город не указан'}
                          </p>
                          <a
                            href={`/profile/${p.user_id}`}
                            className={styles.popupLink}
                          >
                            Смотреть профиль
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
