'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Canvas } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';

// Sample spending data - replace with your actual data
const spendingData = [
  { lat: 40.7128, lng: -74.0060, amount: 500, name: 'New York' },
  { lat: 34.0522, lng: -118.2437, amount: 300, name: 'Los Angeles' },
  { lat: 51.5074, lng: -0.1278, amount: 400, name: 'London' },
];

// Component to handle map initialization and cylinder placement
const MapContent = () => {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create markers with 3D cylinders
    spendingData.forEach(({ lat, lng, amount, name }) => {
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="marker-container">
                  <div class="marker-label">${name}: $${amount}</div>
                </div>`,
          iconSize: [30, 30],
        }),
      }).addTo(map);

      markersRef.current.push(marker);
    });
  }, [map]);

  return null;
};

// 3D Cylinder component
const SpendingCylinder = ({ position, height }: { position: [number, number, number], height: number }) => {
  return (
    <Cylinder
      args={[0.5, 0.5, height, 32]}
      position={position}
      rotation={[0, 0, 0]}
    >
      <meshStandardMaterial 
        color="#00ff88"
        emissive="#00ff88"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </Cylinder>
  );
};

// Main Map component
export default function Map() {
  useEffect(() => {
    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapContainer}>
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={4}
          className={styles.darkMap}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapContent />
        </MapContainer>
      </div>
      <div className={styles.canvasContainer}>
        <Canvas>
          <color attach="background" args={['transparent']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff88" />
          {spendingData.map(({ lat, lng, amount }, index) => (
            <SpendingCylinder
              key={index}
              position={[lat, lng, amount / 100]}
              height={amount / 50}
            />
          ))}
        </Canvas>
      </div>
    </div>
  );
}
