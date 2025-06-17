import L from 'leaflet';
import { AggregatedPoint, DataPoint, Colors } from '../types/visualization';
import { RestaurantData } from '../types/visualization';
import { getRestaurantCoordinates } from '../data/restaurantCoordinates';

export const aggregatePoints = (points: DataPoint[], map: L.Map, threshold: number): AggregatedPoint[] => {
  const zoom = map.getZoom();

  // If zoomed in enough, don't aggregate
  if (zoom >= 15) {
    return points.map(point => ({
      id: point.id,
      name: point.name,
      value: point.value,
      x: map.latLngToContainerPoint(L.latLng(point.coordinates)).x,
      y: map.latLngToContainerPoint(L.latLng(point.coordinates)).y,
      points: [point],
      count: 1,
      coordinates: point.coordinates,
      checkIns: point.checkIns,
      flyEarned: point.flyEarned
    }));
  }

  const aggregated: { [key: string]: AggregatedPoint } = {};

  points.forEach(point => {
    const mapPoint = map.latLngToContainerPoint(L.latLng(point.coordinates));
    const key = `${Math.round(mapPoint.x / threshold)},${Math.round(mapPoint.y / threshold)}`;

    if (!aggregated[key]) {
      aggregated[key] = {
        id: key,
        name: point.name,
        value: point.value,
        x: mapPoint.x,
        y: mapPoint.y,
        points: [point],
        count: 1,
        coordinates: point.coordinates,
        checkIns: point.checkIns,
        flyEarned: point.flyEarned
      };
    } else {
      aggregated[key].value += point.value;
      aggregated[key].points.push(point);
      aggregated[key].count++;
      aggregated[key].checkIns += point.checkIns;
      aggregated[key].flyEarned += point.flyEarned;
      
      // Update name if multiple points
      if (aggregated[key].count > 1) {
        aggregated[key].name = `${aggregated[key].count} locations`;
      }
    }
  });

  return Object.values(aggregated);
};

export const isPointUnderMouse = (
  point: AggregatedPoint,
  mouseX: number,
  mouseY: number,
  map: L.Map,
  barWidth: number
): boolean => {
  const mapPoint = map.latLngToContainerPoint(L.latLng(point.coordinates));
  const selectionRadius = barWidth * 2; // Double the selection radius
  
  const dx = mouseX - mapPoint.x;
  const dy = mouseY - mapPoint.y;
  return Math.sqrt(dx * dx + dy * dy) <= selectionRadius;
};

export const generateTooltipText = (point: AggregatedPoint): string => {
  if (point.count === 1) {
    return `You saved $${point.value} at ${point.name}!`;
  } else {
    const locations = point.points.map(p => `${p.name} ($${p.value})`).join('\n');
    return `You saved $${point.value} across ${point.count} locations:\n${locations}`;
  }
};

export const drawCylinder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  borderColor: string,
  drawBottom: boolean = false
) => {
  // Draw bottom circle first (only for bottom-most)
  if (drawBottom) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + width/2, y, width/2, width/6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Draw bottom border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + width/2, y, width/2, width/6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw front face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y - height);
  ctx.lineTo(x, y - height);
  ctx.closePath();
  ctx.fill();
  // Draw front face border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y - height);
  ctx.lineTo(x, y - height);
  ctx.closePath();
  ctx.stroke();

  // Draw side curves
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + width/2, y, width/2, width/6, 0, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + width/2, y - height, width/2, width/6, 0, 0, Math.PI);
  ctx.stroke();

  // Draw top face last
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + width/2, y - height, width/2, width/6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Draw top border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + width/2, y - height, width/2, width/6, 0, 0, Math.PI * 2);
  ctx.stroke();
};

export const transformData = (data: RestaurantData[]): DataPoint[] => {
  return data.map((restaurant, index) => ({
    id: `restaurant-${index}`,
    name: restaurant.name,
    value: restaurant.totalSpent.value,
    coordinates: getRestaurantCoordinates(restaurant.name),
    checkIns: restaurant.checkIns,
    flyEarned: restaurant.flyEarned || 0
  }));
}; 