import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { logSafely } from "../common/logging/safe-logger";
import { RestaurantResponse, toRestaurantResponse } from "../restaurants/restaurant-response";
import {
  DuplicateFavouriteError,
  FavouriteRecord,
  FavouriteRestaurantNotFoundError,
  FavouritesRepository,
} from "./favourites.repository";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";
const DUPLICATE_FAVOURITE_MESSAGE = "Restaurant is already a favourite.";
const FAVOURITE_NOT_FOUND_MESSAGE = "Favourite not found.";

export class FavouriteResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  restaurantId!: number;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: RestaurantResponse })
  restaurant!: RestaurantResponse;
}

export class FavouritesResponse {
  @ApiProperty({ type: [FavouriteResponse] })
  results!: FavouriteResponse[];
}

@Injectable()
export class FavouritesService {
  private readonly logger = new Logger(FavouritesService.name);

  constructor(private readonly favouritesRepository: FavouritesRepository) {}

  async findMine(userId: number): Promise<FavouritesResponse> {
    const favourites = await this.favouritesRepository.findByUserId(userId);

    return {
      results: favourites.map(toFavouriteResponse),
    };
  }

  async create(userId: number, restaurantId: number): Promise<FavouriteResponse> {
    if (!(await this.favouritesRepository.restaurantExists(restaurantId))) {
      throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
    }

    try {
      const favourite = await this.favouritesRepository.create(userId, restaurantId);

      logSafely(
        this.logger,
        "log",
        `[FAVOURITE] added favouriteId=${favourite.id} restaurantId=${restaurantId} userId=${userId}`,
      );

      return toFavouriteResponse(favourite);
    } catch (error) {
      if (error instanceof DuplicateFavouriteError) {
        throw new ConflictException(DUPLICATE_FAVOURITE_MESSAGE);
      }

      if (error instanceof FavouriteRestaurantNotFoundError) {
        throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
      }

      throw error;
    }
  }

  async delete(userId: number, restaurantId: number): Promise<void> {
    const isDeleted = await this.favouritesRepository.deleteOwned(userId, restaurantId);

    if (!isDeleted) {
      throw new NotFoundException(FAVOURITE_NOT_FOUND_MESSAGE);
    }

    logSafely(
      this.logger,
      "log",
      `[FAVOURITE] removed restaurantId=${restaurantId} userId=${userId}`,
    );
  }
}

function toFavouriteResponse(favourite: FavouriteRecord): FavouriteResponse {
  return {
    id: favourite.id,
    restaurantId: favourite.restaurantId,
    createdAt: favourite.createdAt,
    restaurant: toRestaurantResponse(favourite.restaurant),
  };
}
