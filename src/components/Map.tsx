'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DataVisualizationLayer } from './DataVisualizationLayer';
import { useEffect, useState } from 'react';
import L from 'leaflet';

interface MapProps {
  diningHistory: {
    my2024: {
      restaurantMetrics: {
        topRestaurantsBySpend: Array<{
          name: string;
          totalSpent: { value: number; currency: string };
          checkIns: number;
          percentage: number;
        }>;
      };
      geographic: {
        topCities: Array<{
          name: string;
          checkIns: number;
          spent: { value: number; currency: string };
        }>;
      };
    };
  };
}

export const Map = ({ diningHistory }: MapProps) => {
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (map) {
      // Set initial view to New York City
      map.setView([40.7128, -74.0060], 11);
    }
  }, [map]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={[40.7128, -74.0060]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <DataVisualizationLayer data={diningHistory.my2024.restaurantMetrics.topRestaurantsBySpend} />
      </MapContainer>
    </div>
  );
}; 