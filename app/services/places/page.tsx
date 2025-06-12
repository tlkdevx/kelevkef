'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabaseClient';

type Restaurant = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  website: string | null;
  phone: string | null;
  is_partner: boolean;
};

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const FILTERS = ['all', 'cafe', 'bar', 'park', 'shop'] as const;

export default function RestaurantsPage() {
  const [locations, setLocations] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');

  useEffect(() => {
    supabase
      .from<Restaurant>('restaurants')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setLocations(data || []);
      });
  }, []);

  const filtered = useMemo(() => {
    return filter === 'all'
      ? locations
      : locations.filter((r) => r.category === filter);
  }, [filter, locations]);

  const center: [number, number] = [32.0853, 34.7818];

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Рестораны & Pet-friendly места
      </h1>

      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-gray-800 hover:bg-blue-200'
            }`}
          >
            {f === 'all'
              ? 'Все'
              : f === 'cafe'
              ? 'Кафе'
              : f === 'bar'
              ? 'Бары'
              : f === 'park'
              ? 'Площадки'
              : 'Магазины'}
          </button>
        ))}
      </div>

      <div className="h-[600px] rounded overflow-hidden mb-10">
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm capitalize">{r.category}</p>
                  {r.website && (
                    <a
                      href={r.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Сайт
                    </a>
                  )}
                  {r.phone && <p className="text-sm">Тел: {r.phone}</p>}
                  {r.is_partner && (
                    <p className="text-green-600 text-sm font-medium">
                      ✔ Партнёр KelevKef
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
