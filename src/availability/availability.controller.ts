import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AvailabilityService } from "./availability.service";
import { AvailabilityResponse } from "./availability.types";
import { AvailabilityQueryDto } from "./dto/availability-query.dto";

@Controller("restaurants")
@ApiTags("availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(":restaurantId/availability")
  @ApiOperation({ summary: "Get restaurant availability for a date and party size" })
  @ApiParam({ name: "restaurantId", type: Number, example: 1 })
  @ApiOkResponse({
    description: "Availability calculated successfully.",
    type: AvailabilityResponse,
  })
  @ApiBadRequestResponse({ description: "The path or query parameters failed validation." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  findAvailability(
    @Param("restaurantId", ParseIntPipe) restaurantId: number,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponse> {
    return this.availabilityService.findAvailability(restaurantId, query.date, query.partySize);
  }
}
