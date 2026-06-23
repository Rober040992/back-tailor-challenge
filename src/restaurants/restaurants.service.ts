import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { logSafely } from "../common/logging/safe-logger";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantRecord, RestaurantResponse, toRestaurantResponse } from "./restaurant-response";
import { RestaurantsRepository } from "./restaurants.repository";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";
const RESTAURANT_HAS_RELATIONS_MESSAGE = "Restaurant with related records cannot be deleted.";

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(private readonly restaurantsRepository: RestaurantsRepository) {}

  async findAll(): Promise<RestaurantResponse[]> {
    const restaurants = await this.restaurantsRepository.findAll();

    return restaurants.map(toRestaurantResponse);
  }

  async findOne(id: number): Promise<RestaurantResponse> {
    const restaurant = await this.findExisting(id);

    return toRestaurantResponse(restaurant);
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
    });

    logSafely(
      this.logger,
      "log",
      `[RESTAURANT] created restaurantId=${restaurant.id} userId=${userId}`,
    );

    return toRestaurantResponse(restaurant);
  }

  async update(
    userId: number,
    id: number,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<RestaurantResponse> {
    await this.findExisting(id);

    const restaurant = await this.restaurantsRepository.update(id, updateRestaurantDto);

    logSafely(
      this.logger,
      "log",
      `[RESTAURANT] updated restaurantId=${restaurant.id} userId=${userId}`,
    );

    return toRestaurantResponse(restaurant);
  }

  async delete(userId: number, id: number): Promise<void> {
    await this.findExisting(id);

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
