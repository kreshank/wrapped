'use client';

import diningHistory from '@/data/data.json';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center gap-12">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-gray-200 font-semibold text-4xl opacity-0 animate-fade-in [animation-delay:0.2s]">Continue</span>
          <span className="text-gray-200 font-semibold text-4xl opacity-0 animate-fade-in [animation-delay:0.4s]">to</span>
          <span className="text-gray-200 font-semibold text-4xl opacity-0 animate-fade-in [animation-delay:0.6s]">see</span>
          <span className="text-gray-200 font-semibold text-4xl opacity-0 animate-fade-in [animation-delay:0.8s]">your</span>
          <span className="text-gray-200 font-semibold text-4xl opacity-0 animate-fade-in [animation-delay:1.0s]"><strong>2024</strong></span>
          <span className="text-gray-200 font-semibold text-4xl opacity-0 animate-fade-in [animation-delay:1.2s]">wrapped</span>
        </div>
        <Image
          src="/blackbird.png"
          alt="Blackbird"
          width={120}
          height={120}
          className="transition-transform opacity-0 animate-fade-in [animation-delay:1.6s]"
        />
      </div>
      <button 
        className="group bg-gray-800 rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 opacity-0 animate-fade-in [animation-delay:2.0s]"
        onClick={() => router.push('/map')}
      >
        <svg 
          className="w-6 h-6 text-gray-200 group-hover:translate-x-1 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </button>
    </div>
  );
}