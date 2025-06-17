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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center p-8">
      <div className="max-w-3xl w-full mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Your Restaurant Journey</h1>
        <p className="text-gray-300 text-lg">
          Explore your dining history through an interactive 3D visualization! 
          The height of each bar represents your total spending at each location, 
          with aggregated views when zoomed out and detailed breakdowns when zoomed in.
        </p>
      </div>
      <div className="h-[600px] w-[800px] bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <MapWithNoSSR diningHistory={diningHistory} />
      </div>
    </div>
  );
} 