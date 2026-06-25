import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

interface FavouriteResponse {
  id: number;
  restaurantId: number;
  restaurant: {
    id: number;
  };
}

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
        take: 2,
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

  it("rejects unauthenticated favourite management", async () => {
    await request(app.getHttpServer()).get("/me/favourites").expect(401);
    await request(app.getHttpServer()).post(`/me/favourites/${restaurantIds[0]}`).expect(401);
    await request(app.getHttpServer()).delete(`/me/favourites/${restaurantIds[0]}`).expect(401);
  });

  it("adds a restaurant to favourites", async () => {
    const response = await request(app.getHttpServer())
      .post(`/me/favourites/${restaurantIds[0]}`)
      .set("Cookie", authenticationCookies)
      .expect(201);

    const favourite = response.body as FavouriteResponse;

    expect(favourite).toEqual(
      expect.objectContaining({
        restaurantId: restaurantIds[0],
      }),
    );
    expect(favourite.restaurant).toEqual(
      expect.objectContaining({
        id: restaurantIds[0],
      }),
    );
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
    expect(body.results[0]).toEqual(
      expect.objectContaining({
        restaurantId: restaurantIds[0],
      }),
    );
  });

  it("removes an existing favourite", async () => {
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
      prisma.favourite.findUnique({
        where: {
          userId_restaurantId: {
            userId,
            restaurantId: restaurantIds[0],
          },
        },
      }),
    ).resolves.toBeNull();
  });

  afterAll(async () => {
    await prisma.favourite.deleteMany();
    await app.close();
  });
});
