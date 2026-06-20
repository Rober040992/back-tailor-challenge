import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsRepository } from "./restaurants.repository";
import { RestaurantsService } from "./restaurants.service";

@Module({
  imports: [AuthModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, RestaurantsRepository],
})
export class RestaurantsModule {}
