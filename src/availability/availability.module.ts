import { Module } from "@nestjs/common";
import { AvailabilityCalculator } from "./availability.calculator";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityRepository } from "./availability.repository";
import { AvailabilityService } from "./availability.service";

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository, AvailabilityCalculator],
  exports: [AvailabilityCalculator],
})
export class AvailabilityModule {}
