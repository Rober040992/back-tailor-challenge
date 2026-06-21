import { Injectable, NotFoundException } from "@nestjs/common";
import { AvailabilityRepository, AvailabilityRestaurantRecord } from "./availability.repository";
import { AvailabilityResponse } from "./availability.types";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";

interface ServiceWindow {
  start: string;
  end: string;
}

interface BookedSlot {
  date: string;
  time: string;
  reservedSeats: number;
}

interface ReservationSettings {
  slotIntervalMinutes: number;
  defaultSlotCapacity: number;
  serviceWindows: ServiceWindow[];
  bookedSlots: BookedSlot[];
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly availabilityRepository: AvailabilityRepository) {}

  async findAvailability(
    restaurantId: number,
    date: string,
    partySize: number,
  ): Promise<AvailabilityResponse> {
    const restaurant = await this.availabilityRepository.findRestaurantAvailabilityData(
      restaurantId,
      date,
    );

    if (!restaurant) {
      throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
    }

    return this.calculateAvailability(restaurant, date, partySize);
  }

  calculateAvailability(
    restaurant: AvailabilityRestaurantRecord,
    date: string,
    partySize: number,
  ): AvailabilityResponse {
    const settings = restaurant.reservationSettings as unknown as ReservationSettings;
    const slots = settings.serviceWindows.flatMap(serviceWindow =>
      this.generateTimes(serviceWindow.start, serviceWindow.end, settings.slotIntervalMinutes),
    );

    return {
      restaurantId: restaurant.id,
      date,
      slots: slots.map(time => {
        const seededReservedSeats = settings.bookedSlots
          .filter(bookedSlot => bookedSlot.date === date && bookedSlot.time === time)
          .reduce((total, bookedSlot) => total + bookedSlot.reservedSeats, 0);
        const reservationSeats = restaurant.reservations
          .filter(reservation => reservation.time === time)
          .reduce((total, reservation) => total + reservation.partySize, 0);
        const reservedSeats = seededReservedSeats + reservationSeats;
        const availableSeats = Math.max(settings.defaultSlotCapacity - reservedSeats, 0);

        return {
          time,
          capacity: settings.defaultSlotCapacity,
          reservedSeats,
          availableSeats,
          available: availableSeats >= partySize,
        };
      }),
    };
  }

  private generateTimes(start: string, end: string, intervalMinutes: number): string[] {
    const times: string[] = [];
    const endMinutes = this.toMinutes(end);

    for (
      let currentMinutes = this.toMinutes(start);
      currentMinutes < endMinutes;
      currentMinutes += intervalMinutes
    ) {
      times.push(this.toTime(currentMinutes));
    }

    return times;
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
  }

  private toTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
}
