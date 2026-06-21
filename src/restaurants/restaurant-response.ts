import { Prisma } from "@prisma/client";

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

export interface RestaurantResponse {
  id: number;
  name: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  image: string;
  photograph: string;
  cuisineType: string;
  description: string;
  capacity: number;
  operatingHours: Prisma.JsonValue;
  reservationSettings: Prisma.JsonValue;
  averageRating: number | null;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toRestaurantResponse(restaurant: RestaurantRecord): RestaurantResponse {
  const commentsCount = restaurant._count.comments;
  const averageRating =
    commentsCount === 0
      ? null
      : restaurant.comments.reduce((total, comment) => total + comment.rating, 0) / commentsCount;

  return {
    id: restaurant.id,
    name: restaurant.name,
    neighborhood: restaurant.neighborhood,
    address: restaurant.address,
    lat: restaurant.lat,
    lng: restaurant.lng,
    image: restaurant.image,
    photograph: restaurant.photograph,
    cuisineType: restaurant.cuisineType,
    description: restaurant.description,
    capacity: restaurant.capacity,
    operatingHours: restaurant.operatingHours,
    reservationSettings: restaurant.reservationSettings,
    averageRating,
    commentsCount,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  };
}
