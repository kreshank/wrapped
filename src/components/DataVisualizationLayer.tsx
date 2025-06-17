'use client';

import { useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AggregatedPoint, DataPoint, RestaurantData, TooltipState, PointHeights, PillarHeights } from '../types/visualization';
import { defaultOptions, MAX_HEIGHT, MAX_WIDTH } from '../constants/visualizationOptions';
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
    // Calculate the height ratio based on the point's value relative to the maximum value
    // For aggregated points, we need to consider the total value of all points
    const maxValue = Math.max(...transformedData.map(p => p.value));
    const heightRatio = Math.min(1, point.value / maxValue); // Cap at 1 to respect MAX_HEIGHT
    
    // Calculate the base height using the MAX_HEIGHT constant
    const baseHeight = MAX_HEIGHT * heightRatio;
    
    // Calculate heights based on the 60-20-20-15 distribution
    const centralHeight = baseHeight * 0.6; // 60% of total height
    const innerStacks = 2; // Always 2 inner pillars
    const outerStacks = 1; // Always 1 outer pillar

    // Create inner heights with 20% distribution each
    const innerHeights = Array(innerStacks).fill(0).map(() => baseHeight * 0.2);

    // Create outer height with 15% distribution
    const outerHeights = Array(outerStacks).fill(0).map(() => baseHeight * 0.15);

    return {
      central: centralHeight,
      inner: innerHeights,
      outer: outerHeights
    };
  };

  // Function to calculate width based on zoom level
  const calculateWidth = (zoom: number): number => {
    // Return constant width regardless of zoom
    return MAX_WIDTH;
  };

  // Initialize heights for all points
  const initializeAllHeights = () => {
    if (initializedRef.current) return;
    
    // First, find the maximum value across all individual points
    const maxIndividualValue = Math.max(...transformedData.map(p => p.value));
    
    // Then, find the maximum value across all possible aggregations
    const aggregatedData = aggregatePoints(transformedData, map, mergedOptions.aggregationThreshold);
    const maxAggregatedValue = Math.max(...aggregatedData.map(p => p.value));
    
    // Use the larger of the two as our reference maximum
    const maxValue = Math.max(maxIndividualValue, maxAggregatedValue);
    
    // Initialize heights for all points
    aggregatedData.forEach(point => {
      heightsRef.current[point.id] = initializeHeights(point, maxValue);
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

      // Aggregate points based on current zoom level
      const aggregatedData = aggregatePoints(transformedData, map, mergedOptions.aggregationThreshold);

      aggregatedData.forEach(point => {
        const mapPoint = map.latLngToContainerPoint(L.latLng(point.coordinates));
        // Use constant width for all pillars
        const pillarWidth = MAX_WIDTH;
        const centralOffset = pillarWidth * 0.8;
        const outerOffset = pillarWidth * 1.4;

        const heights = heightsRef.current[point.id];
        if (!heights) return;

        // Remove zoom-based height scaling
        const scaledCentralHeight = heights.central * progress;
        const scaledInnerHeights = heights.inner.map(h => h * progress);
        const scaledOuterHeights = heights.outer.map(h => h * progress);

        // Draw central stack (tallest, always bottom-most)
        drawCylinder(
          ctx,
          mapPoint.x,
          mapPoint.y,
          pillarWidth,
          scaledCentralHeight,
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
            scaledInnerHeights[i],
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
            scaledOuterHeights[i],
            mergedOptions.colors.front,
            mergedOptions.colors.border,
            false // No bottom for outer ring
          );
        }

        // Draw tooltip if this is the hovered point
        if (hoveredPoint?.id === point.id) {
          const tooltipText = generateTooltipText(point);
          const lines = tooltipText.split('\n');
          const lineHeight = 20;
          const padding = 10;
          
          // Calculate text width for each line
          ctx.font = '14px Arial';
          const lineWidths = lines.map(line => ctx.measureText(line).width);
          const maxWidth = Math.max(...lineWidths);
          
          // Calculate tooltip position (right side of the pillar)
          const tooltipX = mapPoint.x + 70; // 70px to the right of the pillar
          const tooltipY = mapPoint.y - (lines.length * lineHeight / 2); // Center vertically with the pillar
          
          // Draw tooltip background with higher z-index
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
          ctx.fillRect(
            tooltipX,
            tooltipY - (lines.length * lineHeight + padding * 2) / 2,
            maxWidth + padding * 2,
            lines.length * lineHeight + padding * 2
          );

          // Draw tooltip text
          ctx.fillStyle = 'white';
          lines.forEach((line, i) => {
            ctx.fillText(
              line,
              tooltipX + padding,
              tooltipY - (lines.length * lineHeight + padding * 2) / 2 + padding + (i + 1) * lineHeight
            );
          });
          ctx.restore();
        }
      });
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

  const generateTooltipText = (point: AggregatedPoint): string => {
    const totalValue = point.points.reduce((sum, p) => sum + p.value, 0) / 100; // Convert cents to dollars
    const avgValue = totalValue / point.points.length;
    const maxValue = Math.max(...point.points.map(p => p.value)) / 100; // Convert cents to dollars
    const minValue = Math.min(...point.points.map(p => p.value)) / 100; // Convert cents to dollars

    return `${point.name}\n` +
           `Total Visits: ${point.count}\n` +
           `Total Spent: $${totalValue.toFixed(2)}\n` +
           `Average: $${avgValue.toFixed(2)}\n` +
           `Max: $${maxValue.toFixed(2)}\n` +
           `Min: $${minValue.toFixed(2)}`;
  };

  return null;
}; 