'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import SimpleNavigation from '@/components/SimpleNavigation';

const DuringJourneyPage = () => {
  const router = useRouter();
  const [focusObject, setFocusObject] = useState('');
  const [focusReason, setFocusReason] = useState('');
  const [emotions, setEmotions] = useState('');
  const [exploration, setExploration] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [bestSensation, setBestSensation] = useState('');
  const [imagery, setImagery] = useState('');
  const [restMoments, setRestMoments] = useState('');
  const [notableSensations, setNotableSensations] = useState('');
  const [bodyConditionAfter, setBodyConditionAfter] = useState('');

  // 페이지 로드 시 localStorage에서 데이터 불러오기
  useEffect(() => {
    const savedFocusObject = localStorage.getItem('focusObject');
    const savedFocusReason = localStorage.getItem('focusReason');
    const savedEmotions = localStorage.getItem('emotions');
    const savedExploration = localStorage.getItem('exploration');
    const savedCurrentState = localStorage.getItem('currentState');
    const savedBestSensation = localStorage.getItem('bestSensation');
    const savedImagery = localStorage.getItem('imagery');
    const savedRestMoments = localStorage.getItem('restMoments');
    const savedNotableSensations = localStorage.getItem('notableSensations');
    const savedBodyConditionAfter = localStorage.getItem('bodyConditionAfter');

    if (savedFocusObject) setFocusObject(savedFocusObject);
    if (savedFocusReason) setFocusReason(savedFocusReason);
    if (savedEmotions) setEmotions(savedEmotions);
    if (savedExploration) setExploration(savedExploration);
    if (savedCurrentState) setCurrentState(savedCurrentState);
    if (savedBestSensation) setBestSensation(savedBestSensation);
    if (savedImagery) setImagery(savedImagery);
    if (savedRestMoments) setRestMoments(savedRestMoments);
    if (savedNotableSensations) setNotableSensations(savedNotableSensations);
    if (savedBodyConditionAfter) setBodyConditionAfter(savedBodyConditionAfter);
  }, []);

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem('focusObject', focusObject);
    localStorage.setItem('focusReason', focusReason);
    localStorage.setItem('emotions', emotions);
    localStorage.setItem('exploration', exploration);
    localStorage.setItem('currentState', currentState);
    localStorage.setItem('bestSensation', bestSensation);
    localStorage.setItem('imagery', imagery);
    localStorage.setItem('restMoments', restMoments);
    localStorage.setItem('notableSensations', notableSensations);
    localStorage.setItem('bodyConditionAfter', bodyConditionAfter);
  }, [focusObject, focusReason, emotions, exploration, currentState, bestSensation, imagery, restMoments, notableSensations, bodyConditionAfter]);

  const handleNext = () => {
    try {
      router.push('/post-journey');
    } catch (error) {
      console.error('Error in handleNext:', error);
      alert('페이지 이동 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <SimpleNavigation />
        
        {/* Stepper */}
        <div className="px-8 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-blue-500 border-blue-500">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="mt-2 text-xs text-gray-500">여행 전</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-500 bg-white">
                <span className="text-sm text-blue-500">2</span>
              </div>
              <span className="mt-2 text-xs text-blue-500 font-medium">여행 중</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white">
                <span className="text-sm text-gray-400">3</span>
              </div>
              <span className="mt-2 text-xs text-gray-500">여행 후</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Focus Object */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              지금 내 시선이 머무는 곳
            </label>
            <input
              type="text"
              placeholder="예시) 작품 제목 / 공간의 특징 / 자연물"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={focusObject}
              onChange={(e) => setFocusObject(e.target.value)}
            />
          </div>

          {/* Focus Reason */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              이곳에 시선이 머무는 이유
            </label>
            <input
              type="text"
              placeholder="예시) 색감이 마음을 편안하게 해서 / 작품의 의미가 공감되어서"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={focusReason}
              onChange={(e) => setFocusReason(e.target.value)}
            />
          </div>

          {/* Emotions */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              떠오르는 감정이나 이미지
            </label>
            <input
              type="text"
              placeholder="예시) 따뜻한 오후의 햇살 같은 포근함"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={emotions}
              onChange={(e) => setEmotions(e.target.value)}
            />
          </div>

          {/* Exploration */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              더 탐구하고 싶은지 여부
            </label>
            <input
              type="text"
              placeholder="예시) 작가의 다른 작품도 보고 싶다 / 지금 이 감정에 충분히 머물고 싶다"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={exploration}
              onChange={(e) => setExploration(e.target.value)}
            />
          </div>

          {/* Body Condition After */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              전시 감상 직후 내 몸 상태는 어떤가요?
            </label>
            <input
              type="text"
              placeholder="예: 다리는 아픈데, 마음은 편해"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={bodyConditionAfter}
              onChange={(e) => setBodyConditionAfter(e.target.value)}
            />
          </div>

          {/* Best Sensation */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              지금 가장 좋은 감각은?
            </label>
            <input
              type="text"
              placeholder="예: 햇살 / 커피 향 / 발바닥에 닿는 잔디"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={bestSensation}
              onChange={(e) => setBestSensation(e.target.value)}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 mb-8">
            <Link
              href="/pre-journey"
              className="flex items-center justify-center w-32 px-6 py-3 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">이전</span>
            </Link>
            <button
              onClick={handleNext}
              className="flex items-center justify-center w-32 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuringJourneyPage; 