import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

const restaurantResponseFields = [
  "address",
  "averageRating",
  "capacity",
  "commentsCount",
  "createdAt",
  "cuisineType",
  "description",
  "id",
  "image",
  "lat",
  "lng",
  "name",
  "neighborhood",
  "operatingHours",
  "photograph",
  "reservationSettings",
  "updatedAt",
];

interface FavouriteListResponse {
  results: Array<{
    id: number;
    restaurantId: number;
  }>;
}

describe("Favourites (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authenticationCookies: string[];
  let userId: number;
  let otherUserId: number;
  let restaurantIds: number[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();

    prisma = app.get(PrismaService);

    const [user, otherUser, restaurants] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { username: "roberto" } }),
      prisma.user.findUniqueOrThrow({ where: { username: "lautaro" } }),
      prisma.restaurant.findMany({
        orderBy: { id: "asc" },
        take: 3,
        select: { id: true },
      }),
    ]);

    userId = user.id;
    otherUserId = otherUser.id;
    restaurantIds = restaurants.map(restaurant => restaurant.id);

    const loginResponse = await request(app.getHttpServer()).post("/auth/login").send({
      username: "roberto",
      password: "12345",
    });
    authenticationCookies = loginResponse.headers["set-cookie"] as unknown as string[];
  });

  beforeEach(async () => {
    await prisma.favourite.deleteMany();
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer()).get("/me/favourites").expect(401);
    await request(app.getHttpServer()).post(`/me/favourites/${restaurantIds[0]}`).expect(401);
    await request(app.getHttpServer()).delete(`/me/favourites/${restaurantIds[0]}`).expect(401);
  });

  it("returns an empty results array when the user has no favourites", async () => {
    const response = await request(app.getHttpServer())
      .get("/me/favourites")
      .set("Cookie", authenticationCookies)
      .expect(200);

    expect(response.body).toEqual({ results: [] });
  });

  it("adds a restaurant and returns the enriched favourite response", async () => {
    const response = await request(app.getHttpServer())
      .post(`/me/favourites/${restaurantIds[0]}`)
      .set("Cookie", authenticationCookies)
      .expect(201);
    const favourite = response.body as Record<string, unknown>;
    const restaurant = favourite.restaurant as Record<string, unknown>;

    expect(Object.keys(favourite).sort()).toEqual([
      "createdAt",
      "id",
      "restaurant",
      "restaurantId",
    ]);
    expect(favourite.restaurantId).toBe(restaurantIds[0]);
    expect(Object.keys(restaurant).sort()).toEqual(restaurantResponseFields);
  });

  it("prevents duplicate favourites", async () => {
    await prisma.favourite.create({
      data: {
        userId,
        restaurantId: restaurantIds[0],
      },
    });

    await request(app.getHttpServer())
      .post(`/me/favourites/${restaurantIds[0]}`)
      .set("Cookie", authenticationCookies)
      .expect(409);
  });

  it("returns not found when adding a missing restaurant", async () => {
    await request(app.getHttpServer())
      .post("/me/favourites/2147483647")
      .set("Cookie", authenticationCookies)
      .expect(404);
  });

  it("rejects invalid restaurant ids", async () => {
    await request(app.getHttpServer())
      .post("/me/favourites/0")
      .set("Cookie", authenticationCookies)
      .expect(400);
    await request(app.getHttpServer())
      .delete("/me/favourites/not-a-number")
      .set("Cookie", authenticationCookies)
      .expect(400);
  });

  it("lists only the authenticated user's favourites", async () => {
    await prisma.favourite.createMany({
      data: [
        {
          userId,
          restaurantId: restaurantIds[0],
        },
        {
          userId: otherUserId,
          restaurantId: restaurantIds[1],
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/me/favourites")
      .set("Cookie", authenticationCookies)
      .expect(200);
    const body = response.body as FavouriteListResponse;

    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toMatchObject({
      restaurantId: restaurantIds[0],
    });
  });

  it("orders favourites by createdAt and id descending", async () => {
    const sameCreatedAt = new Date("2026-06-20T10:00:00.000Z");
    const olderFirst = await prisma.favourite.create({
      data: {
        userId,
        restaurantId: restaurantIds[0],
        createdAt: sameCreatedAt,
      },
    });
    const olderSecond = await prisma.favourite.create({
      data: {
        userId,
        restaurantId: restaurantIds[1],
        createdAt: sameCreatedAt,
      },
    });
    const newest = await prisma.favourite.create({
      data: {
        userId,
        restaurantId: restaurantIds[2],
        createdAt: new Date("2026-06-20T11:00:00.000Z"),
      },
    });

    const response = await request(app.getHttpServer())
      .get("/me/favourites")
      .set("Cookie", authenticationCookies)
      .expect(200);
    const body = response.body as FavouriteListResponse;

    expect(body.results.map(favourite => favourite.id)).toEqual([
      newest.id,
      olderSecond.id,
      olderFirst.id,
    ]);
  });

  it("removes an owned favourite without deleting the restaurant", async () => {
    await prisma.favourite.create({
      data: {
        userId,
        restaurantId: restaurantIds[0],
      },
    });

    await request(app.getHttpServer())
      .delete(`/me/favourites/${restaurantIds[0]}`)
      .set("Cookie", authenticationCookies)
      .expect(204);

    await expect(
      prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantIds[0] } }),
    ).resolves.toBeDefined();
  });

  it("returns not found when removing a favourite not owned by the user", async () => {
    await prisma.favourite.create({
      data: {
        userId: otherUserId,
        restaurantId: restaurantIds[0],
      },
    });

    await request(app.getHttpServer())
      .delete(`/me/favourites/${restaurantIds[0]}`)
      .set("Cookie", authenticationCookies)
      .expect(404);
  });

  afterAll(async () => {
    await prisma.favourite.deleteMany();
    await app.close();
  });
});
