import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";
import type { AvailabilityResponse } from "./availability.types";
import { AvailabilityQueryDto } from "./dto/availability-query.dto";

@Controller("restaurants")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(":restaurantId/availability")
  findAvailability(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponse> {
    return this.availabilityService.findAvailability(restaurantId, query.date, query.partySize);
  }
}
