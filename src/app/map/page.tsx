'use client';

import dynamic from 'next/dynamic';
import diningHistory from '@/data/data.json';

const MapWithNoSSR = dynamic(() => import('@/components/Map').then(mod => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-[800px] flex items-center justify-center bg-gray-800 rounded-lg">
      <div className="text-gray-200 text-xl">Loading map...</div>
    </div>
  ),
});

export default function Map() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-8">
      <div className="h-[600px] w-[800px] bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <MapWithNoSSR diningHistory={diningHistory} />
      </div>
    </div>
  );
} 