import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { logSafely } from "../common/logging/safe-logger";
import { AvailabilityCalculator } from "./availability.calculator";
import { AvailabilityRepository } from "./availability.repository";
import { AvailabilityResponse } from "./availability.types";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

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

    const availability = this.availabilityCalculator.calculate(restaurant, date, partySize);

    logSafely(
      this.logger,
      "log",
      `[AVAILABILITY] checked restaurantId=${restaurantId} date=${date} partySize=${partySize}`,
    );

    return availability;
  }
}
