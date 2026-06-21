import { Module } from "@nestjs/common";
import { AvailabilityModule } from "../availability/availability.module";
import { AuthModule } from "../auth/auth.module";
import { ReservationsController } from "./reservations.controller";
import { ReservationsRepository } from "./reservations.repository";
import { ReservationsService } from "./reservations.service";

@Module({
  imports: [AuthModule, AvailabilityModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
