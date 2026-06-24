import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictException, ForbiddenException, Logger, NotFoundException } from "@nestjs/common";
import { RestaurantRecord } from "./restaurant-response";
import { RestaurantsRepository } from "./restaurants.repository";
import { RestaurantsService } from "./restaurants.service";

function createRestaurantRecord(overrides: Partial<RestaurantRecord> = {}): RestaurantRecord {
  return {
    id: 1,
    ownerId: 7,
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

describe("RestaurantsService", () => {
  let restaurantsService: RestaurantsService;
  let restaurantsRepository: {
    findAll: jest.MockedFunction<RestaurantsRepository["findAll"]>;
    findById: jest.MockedFunction<RestaurantsRepository["findById"]>;
    create: jest.MockedFunction<RestaurantsRepository["create"]>;
    update: jest.MockedFunction<RestaurantsRepository["update"]>;
    hasRelations: jest.MockedFunction<RestaurantsRepository["hasRelations"]>;
    delete: jest.MockedFunction<RestaurantsRepository["delete"]>;
  };
  let logSpy: jest.SpiedFunction<Logger["log"]>;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    restaurantsRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      hasRelations: jest.fn(),
      delete: jest.fn(),
    };
    restaurantsService = new RestaurantsService(
      restaurantsRepository as unknown as RestaurantsRepository,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calculates the average rating and comments count", async () => {
    restaurantsRepository.findAll.mockResolvedValue([
      createRestaurantRecord({
        comments: [{ rating: 4 }, { rating: 5 }],
        _count: { comments: 2 },
      }),
    ]);

    await expect(restaurantsService.findAll()).resolves.toEqual([
      expect.objectContaining({
        averageRating: 4.5,
        commentsCount: 2,
        canEdit: false,
      }),
    ]);
  });

  it("returns a null average rating when the restaurant has no comments", async () => {
    restaurantsRepository.findById.mockResolvedValue(createRestaurantRecord());

    await expect(restaurantsService.findOne(1, 7)).resolves.toEqual(
      expect.objectContaining({
        averageRating: null,
        commentsCount: 0,
        canEdit: true,
      }),
    );
  });

  it("returns not found when the restaurant does not exist", async () => {
    restaurantsRepository.findById.mockResolvedValue(null);

    await expect(restaurantsService.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates a restaurant with defaults for missing optional fields", async () => {
    restaurantsRepository.create.mockResolvedValue(
      createRestaurantRecord({
        name: "Minimal Restaurant",
        neighborhood: "",
        address: "1 Minimal Street",
        lat: 0,
        lng: 0,
        image: "image.jpg",
        photograph: "image.jpg",
        cuisineType: "",
        description: "Minimal description.",
        capacity: 1,
        operatingHours: {},
        reservationSettings: {},
      }),
    );

    await restaurantsService.create(7, {
      name: "Minimal Restaurant",
      address: "1 Minimal Street",
      description: "Minimal description.",
      image: "image.jpg",
    });

    expect(restaurantsRepository.create).toHaveBeenCalledWith({
      name: "Minimal Restaurant",
      neighborhood: "",
      address: "1 Minimal Street",
      lat: 0,
      lng: 0,
      image: "image.jpg",
      photograph: "image.jpg",
      cuisineType: "",
      description: "Minimal description.",
      capacity: 1,
      operatingHours: {},
      reservationSettings: {},
      owner: {
        connect: {
          id: 7,
        },
      },
    });
  });

  it("blocks update when the authenticated user is not the restaurant owner", async () => {
    restaurantsRepository.findById.mockResolvedValue(createRestaurantRecord({ ownerId: 7 }));

    await expect(restaurantsService.update(8, 1, { name: "Blocked" })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(restaurantsRepository.update).not.toHaveBeenCalled();
  });

  it("blocks deletion when the restaurant has related records", async () => {
    restaurantsRepository.findById.mockResolvedValue(createRestaurantRecord());
    restaurantsRepository.hasRelations.mockResolvedValue(true);

    await expect(restaurantsService.delete(7, 1)).rejects.toBeInstanceOf(ConflictException);
    expect(restaurantsRepository.delete).not.toHaveBeenCalled();
  });

  it("blocks deletion when the authenticated user is not the restaurant owner", async () => {
    restaurantsRepository.findById.mockResolvedValue(createRestaurantRecord({ ownerId: 7 }));

    await expect(restaurantsService.delete(8, 1)).rejects.toBeInstanceOf(ForbiddenException);
    expect(restaurantsRepository.hasRelations).not.toHaveBeenCalled();
    expect(restaurantsRepository.delete).not.toHaveBeenCalled();
  });

  it("logs successful restaurant creation and update", async () => {
    const restaurant = createRestaurantRecord();
    restaurantsRepository.create.mockResolvedValue(restaurant);
    restaurantsRepository.findById.mockResolvedValue(restaurant);
    restaurantsRepository.update.mockResolvedValue(restaurant);

    await restaurantsService.create(7, {
      name: restaurant.name,
      address: restaurant.address,
      description: restaurant.description,
    });
    await restaurantsService.update(7, restaurant.id, {});

    expect(logSpy).toHaveBeenCalledWith("[RESTAURANT] created restaurantId=1 userId=7");
    expect(logSpy).toHaveBeenCalledWith("[RESTAURANT] updated restaurantId=1 userId=7");
  });

  it("deletes a restaurant without related records", async () => {
    restaurantsRepository.findById.mockResolvedValue(createRestaurantRecord());
    restaurantsRepository.hasRelations.mockResolvedValue(false);
    restaurantsRepository.delete.mockResolvedValue(true);

    await expect(restaurantsService.delete(7, 1)).resolves.toBeUndefined();
    expect(restaurantsRepository.delete).toHaveBeenCalledWith(1);
    expect(logSpy).toHaveBeenCalledWith("[RESTAURANT] deleted restaurantId=1 userId=7");
  });

  it("maps a foreign key conflict during deletion to conflict", async () => {
    restaurantsRepository.findById.mockResolvedValue(createRestaurantRecord());
    restaurantsRepository.hasRelations.mockResolvedValue(false);
    restaurantsRepository.delete.mockResolvedValue(false);

    await expect(restaurantsService.delete(7, 1)).rejects.toBeInstanceOf(ConflictException);
  });
});
