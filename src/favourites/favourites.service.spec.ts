import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { RestaurantRecord } from "../restaurants/restaurant-response";
import {
  DuplicateFavouriteError,
  FavouriteRecord,
  FavouritesRepository,
} from "./favourites.repository";
import { FavouritesService } from "./favourites.service";

function createRestaurantRecord(overrides: Partial<RestaurantRecord> = {}): RestaurantRecord {
  return {
    id: 1,
    name: "Test Restaurant",
    neighborhood: "Downtown",
    address: "1 Main Street",
    lat: 40.7,
    lng: -74,
    image: "image.jpg",
    photograph: "photograph.jpg",
    cuisineType: "Italian",
    description: "Test description",
    capacity: 40,
    operatingHours: {},
    reservationSettings: {},
    createdAt: new Date("2026-06-20T10:00:00.000Z"),
    updatedAt: new Date("2026-06-20T10:00:00.000Z"),
    comments: [],
    _count: {
      comments: 0,
    },
    ...overrides,
  };
}

function createFavouriteRecord(overrides: Partial<FavouriteRecord> = {}): FavouriteRecord {
  return {
    id: 1,
    userId: 1,
    restaurantId: 1,
    createdAt: new Date("2026-06-21T10:00:00.000Z"),
    restaurant: createRestaurantRecord(),
    ...overrides,
  };
}

describe("FavouritesService", () => {
  let favouritesService: FavouritesService;
  let favouritesRepository: {
    findByUserId: jest.MockedFunction<FavouritesRepository["findByUserId"]>;
    restaurantExists: jest.MockedFunction<FavouritesRepository["restaurantExists"]>;
    create: jest.MockedFunction<FavouritesRepository["create"]>;
    deleteOwned: jest.MockedFunction<FavouritesRepository["deleteOwned"]>;
  };

  beforeEach(() => {
    favouritesRepository = {
      findByUserId: jest.fn(),
      restaurantExists: jest.fn(),
      create: jest.fn(),
      deleteOwned: jest.fn(),
    };
    favouritesService = new FavouritesService(
      favouritesRepository as unknown as FavouritesRepository,
    );
  });

  it("returns conflict when adding a duplicate favourite", async () => {
    favouritesRepository.restaurantExists.mockResolvedValue(true);
    favouritesRepository.create.mockRejectedValue(new DuplicateFavouriteError());

    await expect(favouritesService.create(1, 1)).rejects.toBeInstanceOf(ConflictException);
  });

  it("creates a favourite", async () => {
    favouritesRepository.restaurantExists.mockResolvedValue(true);
    favouritesRepository.create.mockResolvedValue(createFavouriteRecord());

    await expect(favouritesService.create(7, 1)).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        restaurantId: 1,
      }),
    );
  });

  it("returns not found when removing a favourite not owned by the user", async () => {
    favouritesRepository.deleteOwned.mockResolvedValue(false);

    await expect(favouritesService.delete(1, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("removes an owned favourite", async () => {
    favouritesRepository.deleteOwned.mockResolvedValue(true);

    await expect(favouritesService.delete(7, 1)).resolves.toBeUndefined();
  });
});
