import L from 'leaflet';
import { AggregatedPoint, DataPoint, Colors } from '../types/visualization';

export const aggregatePoints = (
  points: DataPoint[],
  map: L.Map,
  threshold: number
): AggregatedPoint[] => {
  const zoom = map.getZoom();

  // If zoomed in enough, don't aggregate
  if (zoom >= 15) {
    return points.map(point => ({ ...point, count: 1, points: [point] }));
  }

  const aggregated: AggregatedPoint[] = [];
  const processed = new Set<string>();

  points.forEach(point => {
    if (processed.has(point.id)) return;

    const pointPixel = map.latLngToContainerPoint(L.latLng(point.coordinates));
    const nearbyPoints = points.filter(otherPoint => {
      if (processed.has(otherPoint.id)) return false;
      const otherPixel = map.latLngToContainerPoint(L.latLng(otherPoint.coordinates));
      const distance = Math.sqrt(
        Math.pow(pointPixel.x - otherPixel.x, 2) + 
        Math.pow(pointPixel.y - otherPixel.y, 2)
      );
      return distance <= threshold;
    });

    // Calculate average position and total value
    const totalValue = nearbyPoints.reduce((sum, p) => sum + p.value, 0);
    const avgLat = nearbyPoints.reduce((sum, p) => sum + p.coordinates[0], 0) / nearbyPoints.length;
    const avgLng = nearbyPoints.reduce((sum, p) => sum + p.coordinates[1], 0) / nearbyPoints.length;

    aggregated.push({
      id: `agg-${point.id}`,
      name: nearbyPoints.length > 1 ? `${nearbyPoints.length} locations` : point.name,
      value: totalValue,
      coordinates: [avgLat, avgLng],
      count: nearbyPoints.length,
      points: nearbyPoints
    });

    nearbyPoints.forEach(p => processed.add(p.id));
  });

  return aggregated;
};

export const isPointUnderMouse = (
  point: AggregatedPoint,
  mouseX: number,
  mouseY: number,
  map: L.Map,
  barWidth: number
): boolean => {
  const mapPoint = map.latLngToContainerPoint(L.latLng(point.coordinates));
  const pillarWidth = barWidth * 0.4;
  const centralOffset = pillarWidth * 0.6;
  const outerOffset = pillarWidth * 1.2;

  // Check central point
  if (Math.abs(mapPoint.x - mouseX) < pillarWidth && 
      Math.abs(mapPoint.y - mouseY) < pillarWidth) {
    return true;
  }

  // Check inner ring
  const innerStacks = Math.min(4, Math.max(4, Math.floor(point.value / 2)));
  for (let i = 0; i < innerStacks; i++) {
    const angle = (i * 360 / innerStacks) * (Math.PI / 180);
    const x = mapPoint.x + Math.cos(angle) * centralOffset;
    const y = mapPoint.y + Math.sin(angle) * centralOffset;
    if (Math.abs(x - mouseX) < pillarWidth && Math.abs(y - mouseY) < pillarWidth) {
      return true;
    }
  }

  // Check outer ring
  const outerStacks = point.count > 1 ? 4 : 0;
  for (let i = 0; i < outerStacks; i++) {
    const angle = (i * 360 / outerStacks) * (Math.PI / 180);
    const x = mapPoint.x + Math.cos(angle) * outerOffset;
    const y = mapPoint.y + Math.sin(angle) * outerOffset;
    if (Math.abs(x - mouseX) < pillarWidth && Math.abs(y - mouseY) < pillarWidth) {
      return true;
    }
  }

  return false;
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