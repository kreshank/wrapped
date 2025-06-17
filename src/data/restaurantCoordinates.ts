export const getRestaurantCoordinates = (name: string): [number, number] => {
  switch (name) {
    case "Le Bernardin":
      return [40.7614, -73.9776];
    case "Crown Shy":
      return [40.7077, -74.0083];
    case "Atomix":
      return [40.7183, -73.9875];
    case "Via Carota":
      return [40.7314, -74.0031];
    case "Republique":
      return [37.7749, -122.4194];
    case "Osteria Francescana":
      return [44.6471, 10.9252];
    case "Lucali":
      return [40.6777, -73.9992];
    case "Tartine":
      return [37.7765, -122.3927];
    case "Quality Meats":
      return [40.7614, -73.9776];
    case "Guelaguetza":
      return [34.0522, -118.2437];
    default:
      return [40.7128, -74.0060]; // Default to NYC center
  }
}; 