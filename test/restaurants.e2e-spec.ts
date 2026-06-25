import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";

const minimalRestaurantPayload = {
  name: "Minimal CRUD Test Restaurant",
  address: "101 Minimal Street",
  description: "Restaurant created with the minimum CRUD payload.",
};

describe("Restaurants CRUD (e2e)", () => {
  let app: INestApplication<App>;
  let authenticationCookies: string[];
  let otherUserAuthenticationCookies: string[];
  let authenticatedUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();

    const loginResponse = await request(app.getHttpServer()).post("/auth/login").send({
      username: "roberto",
      password: "12345",
    });

    authenticationCookies = loginResponse.headers["set-cookie"] as unknown as string[];
    const loginBody = loginResponse.body as { id: number };
    authenticatedUserId = loginBody.id;

    const otherUserLoginResponse = await request(app.getHttpServer()).post("/auth/login").send({
      username: "lautaro",
      password: "12345",
    });

    otherUserAuthenticationCookies = otherUserLoginResponse.headers[
      "set-cookie"
    ] as unknown as string[];
  });

  it("allows public restaurant reads", async () => {
    const listResponse = await request(app.getHttpServer()).get("/restaurants").expect(200);
    const restaurants = listResponse.body as Array<Record<string, unknown>>;

    expect(Array.isArray(restaurants)).toBe(true);

    if (restaurants.length > 0) {
      expect(restaurants[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          canEdit: false,
        }),
      );
    }
  });

  it("requires authentication for restaurant mutations", async () => {
    await request(app.getHttpServer())
      .post("/restaurants")
      .send(minimalRestaurantPayload)
      .expect(401);
    await request(app.getHttpServer())
      .patch("/restaurants/1")
      .send({ name: "Updated" })
      .expect(401);
    await request(app.getHttpServer()).delete("/restaurants/1").expect(401);
  });

  it("creates, reads, updates, and deletes an owned restaurant", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/restaurants")
      .set("Cookie", authenticationCookies)
      .send(minimalRestaurantPayload)
      .expect(201);
    const createdRestaurant = createResponse.body as Record<string, unknown>;
    const restaurantId = createdRestaurant.id as number;

    expect(createdRestaurant).toMatchObject({
      ...minimalRestaurantPayload,
      ownerId: authenticatedUserId,
      canEdit: true,
    });

    const publicGetResponse = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}`)
      .expect(200);
    expect(publicGetResponse.body).toMatchObject({
      id: restaurantId,
      canEdit: false,
    });

    const authenticatedGetResponse = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}`)
      .set("Cookie", authenticationCookies)
      .expect(200);
    expect(authenticatedGetResponse.body).toMatchObject({
      id: restaurantId,
      canEdit: true,
    });

    await request(app.getHttpServer())
      .patch(`/restaurants/${restaurantId}`)
      .set("Cookie", otherUserAuthenticationCookies)
      .send({ name: "Blocked CRUD Test Restaurant" })
      .expect(403);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/restaurants/${restaurantId}`)
      .set("Cookie", authenticationCookies)
      .send({ name: "Updated CRUD Test Restaurant" })
      .expect(200);
    expect(updateResponse.body).toMatchObject({
      id: restaurantId,
      name: "Updated CRUD Test Restaurant",
    });

    await request(app.getHttpServer())
      .delete(`/restaurants/${restaurantId}`)
      .set("Cookie", otherUserAuthenticationCookies)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/restaurants/${restaurantId}`)
      .set("Cookie", authenticationCookies)
      .expect(204);
    await request(app.getHttpServer()).get(`/restaurants/${restaurantId}`).expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
