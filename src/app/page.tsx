'use client';

import diningHistory from '@/data/data.json';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <button 
        className="group relative bg-gray-800 rounded-full p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        onClick={() => router.push('/map')}
      >
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/blackbird.png"
            alt="Blackbird"
            width={48}
            height={48}
            className="group-hover:animate-fly transition-transform"
          />
          <span className="text-gray-200 font-semibold text-lg">Click to see your wrapped</span>
        </div>
      </button>
    </div>
  );
}