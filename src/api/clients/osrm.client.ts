import { IGeolocationService } from "./interfaces/geolocation.interface";
import axios from "axios";

export class OSRMService implements IGeolocationService {
  private baseUrl = "http://router.project-osrm.org/route/v1/driving";

  async calculateRouteDistance(
    coordinates: Array<{ lat: number; lng: number }>
  ): Promise<{
    distance: number;
    distanceKm: number;
    duration: number;
    durationHours: number;
    geometry?: string;
  }> {
    if (coordinates.length < 2) {
      throw new Error("At least two coordinates are required");
    }

    try {
      const coordinatesString = coordinates
        .map((coord) => `${coord.lng},${coord.lat}`)
        .join(";");

      const url = `${this.baseUrl}/${coordinatesString}?overview=false`;

      console.log("Calling OSRM API:", url, coordinates);

      const response = await axios.get(url);

      if (response.data.code !== "Ok") {
        throw new Error(`OSRM API error: ${response.data.code}`);
      }

      const route = response.data.routes[0];

      return {
        distance: route.distance, // meters
        distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
        duration: route.duration, // seconds
        durationHours: parseFloat((route.duration / 3600).toFixed(2)),
        geometry: route.geometry,
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error("OSRM API call failed");
    }
  }
}
