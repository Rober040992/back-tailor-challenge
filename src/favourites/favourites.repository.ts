import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { restaurantWithCommentRatings } from "../restaurants/restaurants.repository";

const favouriteWithRestaurant = Prisma.validator<Prisma.FavouriteDefaultArgs>()({
  include: {
    restaurant: restaurantWithCommentRatings,
  },
});

export type FavouriteRecord = Prisma.FavouriteGetPayload<typeof favouriteWithRestaurant>;

export class DuplicateFavouriteError extends Error {}

export class FavouriteRestaurantNotFoundError extends Error {}

@Injectable()
export class FavouritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: number): Promise<FavouriteRecord[]> {
    return this.prisma.favourite.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      ...favouriteWithRestaurant,
    });
  }

  async restaurantExists(restaurantId: number): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    return restaurant !== null;
  }

  async create(userId: number, restaurantId: number): Promise<FavouriteRecord> {
    try {
      return await this.prisma.favourite.create({
        data: {
          userId,
          restaurantId,
        },
        ...favouriteWithRestaurant,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new DuplicateFavouriteError();
        }

        if (error.code === "P2003") {
          throw new FavouriteRestaurantNotFoundError();
        }
      }

      throw error;
    }
  }

  async deleteOwned(userId: number, restaurantId: number): Promise<boolean> {
    const result = await this.prisma.favourite.deleteMany({
      where: {
        userId,
        restaurantId,
      },
    });

    return result.count > 0;
  }
}
