'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/supabaseClient';

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

type VetService = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  website?: string;
  phone?: string;
};

export default function VetServicesPage() {
  const [services, setServices] = useState<VetService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string| null>(null);
  const [filter, setFilter] = useState('all');
  const [icon, setIcon] = useState<any>(null);

  // Загружаем Leaflet icon только на клиенте
  useEffect(() => {
    import('leaflet').then((L) => {
      setIcon(new L.Icon({
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
      }));
    });
  }, []);

  // Подгружаем из Supabase
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from<VetService>('vet_services')
        .select('*');
      if (error) {
        console.error(error);
        setError('Не удалось загрузить сервисы');
      } else {
        setServices(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const categories = useMemo(() =>
    Array.from(new Set(services.map((s) => s.category.toLowerCase()))),
  [services]);

  const filtered = useMemo(() =>
    filter === 'all'
      ? services
      : services.filter((s) => s.category.toLowerCase() === filter),
  [services, filter]);

  if (loading) return <p className="text-center py-10">Загрузка…</p>;
  if (error)   return <p className="text-center py-10 text-red-600">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">KelevKef’s Vet & Pet Services</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-gray-800 hover:bg-blue-200'
          }`}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-gray-800 hover:bg-blue-200'
            }`}
          >
            {{
              clinic: 'Клиники',
              park: 'Площадки',
              shop: 'Магазины',
              grooming: 'Груминг',
              hotel: 'Зоопитомники',
            }[cat] ?? cat}
          </button>
        ))}
      </div>

      <div className="shadow-lg rounded-lg overflow-hidden">
        <MapContainer
          center={[32.0853, 34.7818]}
          zoom={10}
          scrollWheelZoom
          className="w-full h-[600px]"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {icon && filtered.map((svc) => (
            <Marker
              key={svc.id}
              position={[svc.latitude, svc.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{svc.name}</p>
                  <p className="text-sm text-gray-600">
                    {{
                      clinic: 'Ветеринарная клиника',
                      park: 'Площадка для собак',
                      shop: 'Магазин',
                      grooming: 'Груминг',
                      hotel: 'Зоопитомник',
                    }[svc.category] ?? svc.category}
                  </p>
                  {svc.website && (
                    <a
                      href={svc.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline text-sm block"
                    >
                      Сайт
                    </a>
                  )}
                  {svc.phone && (
                    <p className="text-sm">Тел: {svc.phone}</p>
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
