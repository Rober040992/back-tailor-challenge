import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AvailabilityModule } from "./availability/availability.module";
import { AuthModule } from "./auth/auth.module";
import { CommentsModule } from "./comments/comments.module";
import { FavouritesModule } from "./favourites/favourites.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    AvailabilityModule,
    ReservationsModule,
    FavouritesModule,
    CommentsModule,
  ],
})
export class AppModule {}
