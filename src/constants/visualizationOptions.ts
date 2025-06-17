import { Colors, VisualizationOptions } from '../types/visualization';

export const MAX_HEIGHT = 250; // Maximum height in pixels
export const MAX_WIDTH = 40; // Maximum width in pixels

export const defaultOptions: Required<VisualizationOptions> & { colors: Colors } = {
  barWidth: 10,
  heightScale: 0.0005,
  colors: {
    front: 'rgba(255, 215, 0, 1)',     // Pure gold, fully opaque
    top: 'rgba(255, 215, 0, 1)',       // Same as front
    side: 'rgba(255, 215, 0, 1)',      // Same as front
    text: 'rgba(255, 255, 255, 0.95)', // Brighter white text
    border: 'rgb(94, 53, 25)'     // Dark brown border, fully opaque
  },
  showLabels: true,
  labelOffset: 15,
  animationDuration: 500,
  animationDelay: 100,
  aggregationThreshold: 30
}; 