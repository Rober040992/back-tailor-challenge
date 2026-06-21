import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export const restaurantWithCommentRatings = Prisma.validator<Prisma.RestaurantDefaultArgs>()({
  include: {
    comments: {
      select: {
        rating: true,
      },
    },
    _count: {
      select: {
        comments: true,
      },
    },
  },
});

export type RestaurantRecord = Prisma.RestaurantGetPayload<typeof restaurantWithCommentRatings>;

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<RestaurantRecord[]> {
    return this.prisma.restaurant.findMany(restaurantWithCommentRatings);
  }

  findById(id: number): Promise<RestaurantRecord | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
      ...restaurantWithCommentRatings,
    });
  }

  create(data: Prisma.RestaurantCreateInput): Promise<RestaurantRecord> {
    return this.prisma.restaurant.create({
      data,
      ...restaurantWithCommentRatings,
    });
  }

  update(id: number, data: Prisma.RestaurantUpdateInput): Promise<RestaurantRecord> {
    return this.prisma.restaurant.update({
      where: { id },
      data,
      ...restaurantWithCommentRatings,
    });
  }

  async hasRelations(id: number): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            comments: true,
            favourites: true,
            reservations: true,
          },
        },
      },
    });

    if (!restaurant) {
      return false;
    }

    return (
      restaurant._count.comments > 0 ||
      restaurant._count.favourites > 0 ||
      restaurant._count.reservations > 0
    );
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.restaurant.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return false;
      }

      throw error;
    }
  }
}
