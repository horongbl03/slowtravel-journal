'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Home } from 'lucide-react';

interface WeatherData {
  main: {
    temp: number;
  };
  weather: Array<{
    description: string;
  }>;
}

const Header = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
        );
        setWeather(response.data);
        setError(null);
      } catch (err) {
        setError('날씨 정보를 불러오는데 실패했습니다.');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
      <div className="max-w-lg mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700">
          <Home className="w-4 h-4 mr-1.5" />
          <span className="text-sm">홈</span>
        </Link>

        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="animate-pulse h-6 w-24 bg-gray-200 rounded"></div>
          ) : error ? (
            <span className="text-sm text-gray-500">{error}</span>
          ) : weather ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{Math.round(weather.main.temp)}°C</span>
              <span>•</span>
              <span>{weather.weather[0].description}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Header; 