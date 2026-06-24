import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { logSafely } from "../common/logging/safe-logger";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantRecord, RestaurantResponse, toRestaurantResponse } from "./restaurant-response";
import { RestaurantsRepository } from "./restaurants.repository";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";
const RESTAURANT_HAS_RELATIONS_MESSAGE = "Restaurant with related records cannot be deleted.";
const RESTAURANT_OWNER_REQUIRED_MESSAGE = "Only the restaurant owner can perform this action.";

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(private readonly restaurantsRepository: RestaurantsRepository) {}

  async findAll(currentUserId?: number): Promise<RestaurantResponse[]> {
    const restaurants = await this.restaurantsRepository.findAll();

    return restaurants.map(restaurant => toRestaurantResponse(restaurant, currentUserId));
  }

  async findOne(id: number, currentUserId?: number): Promise<RestaurantResponse> {
    const restaurant = await this.findExisting(id);

    return toRestaurantResponse(restaurant, currentUserId);
  }

  async create(
    userId: number,
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<RestaurantResponse> {
    const image = createRestaurantDto.image ?? "";
    const restaurant = await this.restaurantsRepository.create({
      name: createRestaurantDto.name,
      neighborhood: createRestaurantDto.neighborhood ?? "",
      address: createRestaurantDto.address,
      lat: createRestaurantDto.lat ?? 0,
      lng: createRestaurantDto.lng ?? 0,
      image,
      photograph: createRestaurantDto.photograph ?? image,
      cuisineType: createRestaurantDto.cuisineType ?? "",
      description: createRestaurantDto.description,
      capacity: createRestaurantDto.capacity ?? 1,
      operatingHours: createRestaurantDto.operatingHours ?? {},
      reservationSettings: createRestaurantDto.reservationSettings ?? {},
      owner: {
        connect: {
          id: userId,
        },
      },
    });

    logSafely(
      this.logger,
      "log",
      `[RESTAURANT] created restaurantId=${restaurant.id} userId=${userId}`,
    );

    return toRestaurantResponse(restaurant, userId);
  }

  async update(
    userId: number,
    id: number,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<RestaurantResponse> {
    const existingRestaurant = await this.findExisting(id);

    if (existingRestaurant.ownerId !== userId) {
      throw new ForbiddenException(RESTAURANT_OWNER_REQUIRED_MESSAGE);
    }

    const restaurant = await this.restaurantsRepository.update(id, updateRestaurantDto);

    logSafely(
      this.logger,
      "log",
      `[RESTAURANT] updated restaurantId=${restaurant.id} userId=${userId}`,
    );

    return toRestaurantResponse(restaurant, userId);
  }

  async delete(userId: number, id: number): Promise<void> {
    const restaurant = await this.findExisting(id);

    if (restaurant.ownerId !== userId) {
      throw new ForbiddenException(RESTAURANT_OWNER_REQUIRED_MESSAGE);
    }

    if (await this.restaurantsRepository.hasRelations(id)) {
      throw new ConflictException(RESTAURANT_HAS_RELATIONS_MESSAGE);
    }

    const isDeleted = await this.restaurantsRepository.delete(id);

    if (!isDeleted) {
      throw new ConflictException(RESTAURANT_HAS_RELATIONS_MESSAGE);
    }

    logSafely(this.logger, "log", `[RESTAURANT] deleted restaurantId=${id} userId=${userId}`);
  }

  private async findExisting(id: number): Promise<RestaurantRecord> {
    const restaurant = await this.restaurantsRepository.findById(id);

    if (!restaurant) {
      throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
    }

    return restaurant;
  }
}
