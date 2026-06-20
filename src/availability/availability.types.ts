export interface AvailabilitySlotResponse {
  time: string;
  capacity: number;
  reservedSeats: number;
  availableSeats: number;
  available: boolean;
}

export interface AvailabilityResponse {
  restaurantId: number;
  date: string;
  slots: AvailabilitySlotResponse[];
}