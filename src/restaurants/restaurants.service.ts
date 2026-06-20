import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantRecord, RestaurantsRepository } from "./restaurants.repository";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";
const RESTAURANT_HAS_RELATIONS_MESSAGE = "Restaurant with related records cannot be deleted.";

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

@Injectable()
export class RestaurantsService {
  constructor(private readonly restaurantsRepository: RestaurantsRepository) {}

  async findAll(): Promise<RestaurantResponse[]> {
    const restaurants = await this.restaurantsRepository.findAll();

    return restaurants.map(restaurant => this.toResponse(restaurant));
  }

  async findOne(id: number): Promise<RestaurantResponse> {
    const restaurant = await this.findExisting(id);

    return this.toResponse(restaurant);
  }

  async create(createRestaurantDto: CreateRestaurantDto): Promise<RestaurantResponse> {
    const restaurant = await this.restaurantsRepository.create(createRestaurantDto);

    return this.toResponse(restaurant);
  }

  async update(id: number, updateRestaurantDto: UpdateRestaurantDto): Promise<RestaurantResponse> {
    await this.findExisting(id);

    const restaurant = await this.restaurantsRepository.update(id, updateRestaurantDto);

    return this.toResponse(restaurant);
  }

  async delete(id: number): Promise<void> {
    await this.findExisting(id);

    if (await this.restaurantsRepository.hasRelations(id)) {
      throw new ConflictException(RESTAURANT_HAS_RELATIONS_MESSAGE);
    }

    const isDeleted = await this.restaurantsRepository.delete(id);

    if (!isDeleted) {
      throw new ConflictException(RESTAURANT_HAS_RELATIONS_MESSAGE);
    }
  }

  private async findExisting(id: number): Promise<RestaurantRecord> {
    const restaurant = await this.restaurantsRepository.findById(id);

    if (!restaurant) {
      throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
    }

    return restaurant;
  }

  private toResponse(restaurant: RestaurantRecord): RestaurantResponse {
    const commentsCount = restaurant._count.comments;
    const averageRating = commentsCount === 0 ? null : restaurant.comments.reduce((total, comment) => total + comment.rating, 0) / commentsCount;

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
}
