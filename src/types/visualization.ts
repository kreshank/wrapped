export interface DataPoint {
  id: string;
  name: string;
  value: number;
  coordinates: [number, number];
}

export interface RestaurantData {
  name: string;
  totalSpent: { value: number; currency: string };
  checkIns: number;
  percentage: number;
}

export interface AggregatedPoint extends DataPoint {
  count: number;
  points: DataPoint[];
}

export interface Colors {
  front: string;
  top: string;
  side: string;
  text: string;
  border: string;
}

export interface VisualizationOptions {
  barWidth?: number;
  heightScale?: number;
  colors?: Partial<Colors>;
  showLabels?: boolean;
  labelOffset?: number;
  animationDuration?: number;
  animationDelay?: number;
  aggregationThreshold?: number;
}

export interface TooltipState {
  x: number;
  y: number;
  text: string;
  visible: boolean;
}

export interface PillarHeights {
  central: number;
  inner: number[];
  outer: number[];
}

export interface PointHeights {
  [key: string]: PillarHeights;
} 