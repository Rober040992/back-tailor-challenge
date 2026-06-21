import { Injectable, NotFoundException } from "@nestjs/common";
import { AvailabilityCalculator } from "./availability.calculator";
import { AvailabilityRepository } from "./availability.repository";
import { AvailabilityResponse } from "./availability.types";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly availabilityCalculator: AvailabilityCalculator,
  ) {}

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

    return this.availabilityCalculator.calculate(restaurant, date, partySize);
  }
}
