export interface CreateVehicleDto {
  licensePlate: string;
  model: string;
  transportType: string; // TODO: Use TransportType enum
  status?: string; // TODO: Use VehicleStatus enum
  purchaseDate?: string; // ISO string
  pricePerKmEUR: number;
  capacity?: number;
  fuelType?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}

export interface UpdateVehicleDto {
  status?: string;
  pricePerKmEUR?: number;
  currentLocation?: {
    lat: number;
    lng: number;
  } | null;
  notes?: string;
  fuelType?: string;
  capacity?: number;
}

export interface VehicleResponseDto {
  id: string;
  licensePlate: string;
  model: string;
  transportType: string;
  status: string;
  pricePerKmEUR: number;
  capacity?: number;
  fuelType?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}
