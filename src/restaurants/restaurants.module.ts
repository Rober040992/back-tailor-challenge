import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OptionalJwtAuthGuard } from "./optional-jwt-auth.guard";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsRepository } from "./restaurants.repository";
import { RestaurantsService } from "./restaurants.service";

@Module({
  imports: [AuthModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository, OptionalJwtAuthGuard],
})
export class RestaurantsModule {}
