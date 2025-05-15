'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

const SimpleNavigation = () => {
  const [weather, setWeather] = useState<{ temp: number; description: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        if (!apiKey) throw new Error('API Key not set');
        const url = `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${apiKey}&units=metric&lang=kr`;
        const res = await axios.get(url);
        const temp = res.data.main.temp;
        const description = res.data.weather[0].description;
        const icon = res.data.weather[0].icon;
        setWeather({ temp, description, icon });
      } catch {
        setError('날씨 정보를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700">
          <Home className="w-4 h-4 mr-1" />
          <span className="text-xs">홈으로</span>
        </Link>
        <div className="flex items-center min-w-[120px] justify-end">
          {loading ? (
            <div className="animate-pulse h-5 w-20 bg-gray-200 rounded" />
          ) : error ? (
            <span className="text-xs text-gray-400">{error}</span>
          ) : weather ? (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              {weather.icon ? (
                <Image
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  width={32}
                  height={32}
                  className="w-6 h-6"
                  style={{ marginRight: 2 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/fallback-weather.png';
                  }}
                />
              ) : (
                <span className="w-6 h-6 mr-2 inline-block bg-gray-200 rounded" />
              )}
              {Math.round(weather.temp)}°C · {weather.description}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SimpleNavigation; 