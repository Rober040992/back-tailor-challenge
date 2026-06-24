import { ApiProperty } from "@nestjs/swagger";
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

export class RestaurantResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  ownerId!: number;

  @ApiProperty({ example: "The Example Table" })
  name!: string;

  @ApiProperty({ example: "Downtown" })
  neighborhood!: string;

  @ApiProperty({ example: "123 Example Street" })
  address!: string;

  @ApiProperty({ example: 40.4168 })
  lat!: number;

  @ApiProperty({ example: -3.7038 })
  lng!: number;

  @ApiProperty({ example: "https://example.com/restaurant.jpg" })
  image!: string;

  @ApiProperty({ example: "https://example.com/restaurant-detail.jpg" })
  photograph!: string;

  @ApiProperty({ example: "Mediterranean" })
  cuisineType!: string;

  @ApiProperty({ example: "Seasonal Mediterranean cuisine." })
  description!: string;

  @ApiProperty({ example: 40 })
  capacity!: number;

  @ApiProperty({ type: Object, additionalProperties: true })
  operatingHours!: Prisma.JsonValue;

  @ApiProperty({ type: Object, additionalProperties: true })
  reservationSettings!: Prisma.JsonValue;

  @ApiProperty({ example: 4.5, nullable: true })
  averageRating!: number | null;

  @ApiProperty({ example: 12 })
  commentsCount!: number;

  @ApiProperty({ example: true })
  canEdit!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export function toRestaurantResponse(
  restaurant: RestaurantRecord,
  currentUserId?: number,
): RestaurantResponse {
  const commentsCount = restaurant._count.comments;
  const averageRating =
    commentsCount === 0
      ? null
      : restaurant.comments.reduce((total, comment) => total + comment.rating, 0) / commentsCount;

  return {
    id: restaurant.id,
    ownerId: restaurant.ownerId,
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
    canEdit: currentUserId === restaurant.ownerId,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  };
}
