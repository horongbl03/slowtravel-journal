'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

const SimpleNavigation = () => {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 px-4 py-3">
        <Home className="w-4 h-4 mr-1" />
        <span className="text-xs">홈으로</span>
      </Link>
    </div>
  );
};

export default SimpleNavigation; 