export interface IGeolocationService {
  calculateRouteDistance(
    coordinates: Array<{ lat: number; lng: number }>
  ): Promise<{
    distance: number; // meters
    distanceKm: number;
    duration: number; // seconds
    durationHours: number;
    geometry?: string;
  }>;
}
