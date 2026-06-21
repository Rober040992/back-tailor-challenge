import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FavouritesController } from "./favourites.controller";
import { FavouritesRepository } from "./favourites.repository";
import { FavouritesService } from "./favourites.service";

@Module({
  imports: [AuthModule],
  controllers: [FavouritesController],
  providers: [FavouritesService, FavouritesRepository],
})
export class FavouritesModule {}
