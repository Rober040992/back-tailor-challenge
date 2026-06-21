import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";

const restaurantPayload = {
  name: "CRUD Test Restaurant",
  neighborhood: "Downtown",
  address: "100 Test Street",
  lat: 40.7128,
  lng: -74.006,
  image: "https://example.com/image.jpg",
  photograph: "https://example.com/photograph.jpg",
  cuisineType: "Italian",
  description: "Restaurant created by the CRUD e2e test.",
  capacity: 50,
  operatingHours: {
    monday: {
      open: "09:00",
      close: "22:00",
    },
  },
  reservationSettings: {
    slotInterval: 30,
  },
};

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

describe("Restaurants CRUD (e2e)", () => {
  let app: INestApplication<App>;
  let authenticationCookies: string[];

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
  });

  it("allows public restaurant reads", async () => {
    const listResponse = await request(app.getHttpServer()).get("/restaurants").expect(200);
    const restaurants = listResponse.body as unknown[];

    expect(Array.isArray(restaurants)).toBe(true);

    if (restaurants.length > 0) {
      const restaurant = restaurants[0] as Record<string, unknown>;
      expect(Object.keys(restaurant).sort()).toEqual(restaurantResponseFields);
    }
  });

  it("requires authentication for restaurant mutations", async () => {
    await request(app.getHttpServer()).post("/restaurants").send(restaurantPayload).expect(401);
    await request(app.getHttpServer())
      .patch("/restaurants/1")
      .send({ name: "Updated" })
      .expect(401);
    await request(app.getHttpServer()).delete("/restaurants/1").expect(401);
  });

  it("validates create and update payloads", async () => {
    await request(app.getHttpServer())
      .post("/restaurants")
      .set("Cookie", authenticationCookies)
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .patch("/restaurants/1")
      .set("Cookie", authenticationCookies)
      .send({ unsupportedField: true })
      .expect(400);
  });

  it("creates, reads, updates, and deletes a restaurant", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/restaurants")
      .set("Cookie", authenticationCookies)
      .send(restaurantPayload)
      .expect(201);
    const createdRestaurant = createResponse.body as Record<string, unknown>;
    const restaurantId = createdRestaurant.id as number;

    expect(Object.keys(createdRestaurant).sort()).toEqual(restaurantResponseFields);
    expect(createdRestaurant).toMatchObject({
      ...restaurantPayload,
      averageRating: null,
      commentsCount: 0,
    });

    const getResponse = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}`)
      .expect(200);
    expect(getResponse.body).toMatchObject({
      id: restaurantId,
      name: restaurantPayload.name,
    });

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
      .set("Cookie", authenticationCookies)
      .expect(204);
    await request(app.getHttpServer()).get(`/restaurants/${restaurantId}`).expect(404);
  });

  it("returns not found for missing restaurant mutations", async () => {
    const missingId = 2147483647;

    await request(app.getHttpServer())
      .patch(`/restaurants/${missingId}`)
      .set("Cookie", authenticationCookies)
      .send({ name: "Missing" })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/restaurants/${missingId}`)
      .set("Cookie", authenticationCookies)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
