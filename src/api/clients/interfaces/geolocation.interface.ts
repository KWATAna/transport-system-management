export interface IGeolocationService {
  calculateRouteDistance(
    coordinates: Array<{ lat: number; lng: number }>
  ): Promise<{
    distance: number;
    distanceKm: number;
    duration: number;
    durationHours: number;
    geometry?: string;
  }>;
}
