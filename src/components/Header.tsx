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
        // 임시로 API 키를 직접 설정
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        if (!apiKey) {
          throw new Error('OpenWeather API key is not configured');
        }
        console.log('API Key length:', apiKey.length);
        console.log('API Key first/last chars:', apiKey.charAt(0), apiKey.charAt(apiKey.length - 1));

        const url = `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${apiKey}&units=metric`;
        console.log('Making request to:', url.replace(apiKey, '***'));

        const response = await axios.get(url);
        console.log('Weather API response:', response.data);
        
        if (!response.data) {
          throw new Error('No data received from weather API');
        }

        setWeather(response.data);
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        
        if (err instanceof Error) {
          setError(err.message);
        } else if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const statusText = err.response?.statusText;
          const data = err.response?.data;
          console.error('Axios error details:', { status, statusText, data });
          setError(`날씨 정보를 불러오는데 실패했습니다: ${status} ${statusText}`);
        } else {
          setError('날씨 정보를 불러오는데 실패했습니다.');
        }
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