'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Check } from 'lucide-react';

const JourneyNavigation = () => {
  const pathname = usePathname();

  const steps = [
    { path: '/pre-journey', label: '여행 전' },
    { path: '/during-journey', label: '여행 중' },
    { path: '/post-journey', label: '여행 후' },
  ];

  const getCurrentStepIndex = () => {
    const currentIndex = steps.findIndex(step => step.path === pathname);
    return currentIndex === -1 ? 0 : currentIndex;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      {/* Home Button */}
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 px-4 py-3">
          <Home className="w-4 h-4 mr-1" />
          <span className="text-xs">홈으로</span>
        </Link>

        {/* Stepper Navigation */}
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.path} className="flex flex-col items-center">
                  <Link href={step.path} className="flex flex-col items-center">
                    {/* Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? 'bg-blue-500 border-blue-500'
                          : isCurrent
                          ? 'border-blue-500 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className={`text-sm ${isCurrent ? 'text-blue-500' : 'text-gray-400'}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-2 text-xs ${
                        isCurrent ? 'text-blue-500 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyNavigation; 