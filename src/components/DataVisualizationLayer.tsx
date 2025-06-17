'use client';

import { useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AggregatedPoint, DataPoint, RestaurantData, TooltipState, PointHeights, PillarHeights } from '../types/visualization';
import { defaultOptions } from '../constants/visualizationOptions';
import { aggregatePoints, isPointUnderMouse, generateTooltipText, drawCylinder } from '../utils/visualizationUtils';
import { getRestaurantCoordinates } from '../data/restaurantCoordinates';

interface DataVisualizationLayerProps {
  data: RestaurantData[];
  options?: Partial<typeof defaultOptions>;
}

export const DataVisualizationLayer = ({ data, options = {} }: DataVisualizationLayerProps) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const heightsRef = useRef<PointHeights>({});
  const initializedRef = useRef<boolean>(false);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, text: '', visible: false });
  const [hoveredPoint, setHoveredPoint] = useState<AggregatedPoint | null>(null);

  // Transform restaurant data into DataPoints
  const transformedData: DataPoint[] = data.map((restaurant, index) => ({
    id: `restaurant-${index}`,
    name: restaurant.name,
    value: restaurant.totalSpent.value,
    coordinates: getRestaurantCoordinates(restaurant.name)
  }));

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    colors: {
      front: options.colors?.front ?? defaultOptions.colors.front,
      top: options.colors?.top ?? defaultOptions.colors.top,
      side: options.colors?.side ?? defaultOptions.colors.side,
      text: options.colors?.text ?? defaultOptions.colors.text,
      border: options.colors?.border ?? defaultOptions.colors.border
    }
  };

  // Function to initialize heights for a point
  const initializeHeights = (point: AggregatedPoint, totalHeight: number): PillarHeights => {
    // Use logarithmic scale for more reasonable height distribution
    const logValue = Math.log(point.value + 1);
    const scaledHeight = logValue * mergedOptions.heightScale * 2000;
    
    // Calculate heights based on the 40-30-20-10 distribution
    const centralHeight = scaledHeight * 0.4; // 40% of total height
    const innerStacks = Math.min(4, Math.max(4, Math.floor(point.value / 2000)));
    const outerStacks = point.count > 1 ? 4 : 0;

    // Create inner heights with 30% and 20% distribution
    const innerHeights = Array(innerStacks).fill(0).map((_, index) => {
      if (index === 0) return scaledHeight * 0.3; // First inner pillar gets 30%
      if (index === 1) return scaledHeight * 0.2; // Second inner pillar gets 20%
      return scaledHeight * 0.1; // Remaining inner pillars get 10%
    });

    // Create outer heights with 10% distribution
    const outerHeights = Array(outerStacks).fill(0).map(() => scaledHeight * 0.1);

    return {
      central: centralHeight,
      inner: innerHeights,
      outer: outerHeights
    };
  };

  // Initialize heights for all points
  const initializeAllHeights = () => {
    if (initializedRef.current) return;
    
    const aggregatedData = aggregatePoints(transformedData, map, mergedOptions.aggregationThreshold);
    aggregatedData.forEach(point => {
      const totalHeight = point.value * mergedOptions.heightScale;
      heightsRef.current[point.id] = initializeHeights(point, totalHeight);
    });
    
    initializedRef.current = true;
  };

  useEffect(() => {
    // Create canvas element with lower resolution
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'auto';
    canvas.style.zIndex = '1000';
    canvas.width = window.innerWidth * 0.75;  // Reduced resolution
    canvas.height = window.innerHeight * 0.75; // Reduced resolution
    
    // Find the map container and append canvas
    const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
    if (mapContainer) {
      mapContainer.style.position = 'relative';
      mapContainer.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize heights once
    initializeAllHeights();

    // Add mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find the point under the mouse
      const aggregatedData = aggregatePoints(transformedData, map, mergedOptions.aggregationThreshold);
      const pointUnderMouse = aggregatedData.find(point => 
        isPointUnderMouse(point, mouseX, mouseY, map, mergedOptions.barWidth)
      );

      if (pointUnderMouse) {
        setHoveredPoint(pointUnderMouse);
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          text: generateTooltipText(pointUnderMouse),
          visible: true
        });
      } else {
        setHoveredPoint(null);
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      setTooltip(prev => ({ ...prev, visible: false }));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const drawBars = (progress: number = 1) => {
      if (!ctx) return;

      // Clear the entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get the map container's position
      const mapRect = mapContainer?.getBoundingClientRect();
      if (!mapRect) return;

      // Get current zoom level
      const zoom = map.getZoom();
      const zoomScale = Math.pow(1.5, zoom - 11);
      const heightScale = Math.pow(1.4, zoom - 11);

      // Aggregate points based on current zoom level
      const aggregatedData = aggregatePoints(transformedData, map, mergedOptions.aggregationThreshold);

      aggregatedData.forEach(point => {
        const mapPoint = map.latLngToContainerPoint(L.latLng(point.coordinates));
        const basePillarWidth = mergedOptions.barWidth * 0.4;
        const pillarWidth = basePillarWidth * zoomScale;
        const centralOffset = pillarWidth * 0.8;
        const outerOffset = pillarWidth * 1.4;

        const heights = heightsRef.current[point.id];
        if (!heights) return;

        // Draw central stack (tallest, always bottom-most)
        drawCylinder(
          ctx,
          mapPoint.x,
          mapPoint.y,
          pillarWidth,
          heights.central * progress * heightScale,
          mergedOptions.colors.front,
          mergedOptions.colors.border,
          true // Draw bottom for the central pillar
        );

        // Draw inner ring of stacks (no bottom)
        const innerStacks = heights.inner.length;
        for (let i = 0; i < innerStacks; i++) {
          const angle = (i * 360 / innerStacks) * (Math.PI / 180);
          const x = mapPoint.x + Math.cos(angle) * centralOffset;
          const y = mapPoint.y + Math.sin(angle) * centralOffset;
          drawCylinder(
            ctx,
            x,
            y,
            pillarWidth,
            heights.inner[i] * progress * heightScale,
            mergedOptions.colors.front,
            mergedOptions.colors.border,
            false // No bottom for inner ring
          );
        }

        // Draw outer ring of stacks (no bottom)
        const outerStacks = heights.outer.length;
        for (let i = 0; i < outerStacks; i++) {
          const angle = (i * 360 / outerStacks) * (Math.PI / 180);
          const x = mapPoint.x + Math.cos(angle) * outerOffset;
          const y = mapPoint.y + Math.sin(angle) * outerOffset;
          drawCylinder(
            ctx,
            x,
            y,
            pillarWidth,
            heights.outer[i] * progress * heightScale,
            mergedOptions.colors.front,
            mergedOptions.colors.border,
            false // No bottom for outer ring
          );
        }
      });

      // Draw tooltip if visible
      if (tooltip.visible) {
        const lines = tooltip.text.split('\n');
        const lineHeight = 20;
        const padding = 10;
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        
        // Draw tooltip background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(
          tooltip.x + 10,
          tooltip.y + 10,
          maxWidth + padding * 2,
          lines.length * lineHeight + padding * 2
        );

        // Draw tooltip text
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        lines.forEach((line, i) => {
          ctx.fillText(
            line,
            tooltip.x + 10 + padding,
            tooltip.y + 10 + padding + (i + 1) * lineHeight
          );
        });
      }
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const delay = mergedOptions.animationDelay;
      const duration = mergedOptions.animationDuration;

      if (elapsed < delay) {
        // Wait for the delay
        drawBars(0);
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(1, (elapsed - delay) / duration);
      drawBars(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    const resizeCanvas = () => {
      if (mapContainer) {
        canvas.width = mapContainer.clientWidth;
        canvas.height = mapContainer.clientHeight;
        drawBars(1); // Draw at full height when resizing
      }
    };

    // Start the animation
    animationRef.current = requestAnimationFrame(animate);

    // Add event listeners
    map.on('moveend', () => drawBars(1));
    map.on('zoomend', () => drawBars(1));
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationRef.current);
      map.off('moveend', () => drawBars(1));
      map.off('zoomend', () => drawBars(1));
      window.removeEventListener('resize', resizeCanvas);
      canvas.remove();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      heightsRef.current = {};
      initializedRef.current = false;
    };
  }, [map, transformedData, mergedOptions, tooltip]);

  return null;
}; 