import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

const commentResponseFields = [
  "body",
  "createdAt",
  "date",
  "id",
  "name",
  "rating",
  "restaurantId",
  "updatedAt",
  "userId",
];

interface CommentResponseBody {
  id: number;
  restaurantId: number;
  userId: number;
  name: string;
  date: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsListResponseBody {
  results: CommentResponseBody[];
}

describe("Comments (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authenticationCookies: string[];
  let otherAuthenticationCookies: string[];
  let userId: number;
  let otherUserId: number;
  let restaurantId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();

    prisma = app.get(PrismaService);

    const [user, otherUser, restaurant, loginResponse, otherLoginResponse] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { username: "roberto" } }),
      prisma.user.findUniqueOrThrow({ where: { username: "lautaro" } }),
      prisma.restaurant.create({
        data: {
          name: "Comments E2E Restaurant",
          neighborhood: "Downtown",
          address: "200 Comments Street",
          lat: 40.7128,
          lng: -74.006,
          image: "https://example.com/comments-image.jpg",
          photograph: "https://example.com/comments-photograph.jpg",
          cuisineType: "Test",
          description: "Restaurant used by comments e2e tests.",
          capacity: 20,
          operatingHours: {},
          reservationSettings: {},
        },
      }),
      request(app.getHttpServer()).post("/auth/login").send({
        username: "roberto",
        password: "12345",
      }),
      request(app.getHttpServer()).post("/auth/login").send({
        username: "lautaro",
        password: "12345",
      }),
    ]);

    userId = user.id;
    otherUserId = otherUser.id;
    restaurantId = restaurant.id;
    authenticationCookies = loginResponse.headers["set-cookie"] as unknown as string[];
    otherAuthenticationCookies = otherLoginResponse.headers["set-cookie"] as unknown as string[];
  });

  beforeEach(async () => {
    await prisma.comment.deleteMany({ where: { restaurantId } });
  });

  it("lists comments for an existing restaurant", async () => {
    await prisma.comment.create({
      data: {
        userId,
        restaurantId,
        name: "roberto",
        date: "2026-06-21",
        rating: 4,
        body: "Great food.",
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/comments`)
      .expect(200);
    const body = response.body as CommentsListResponseBody;

    expect(body.results).toHaveLength(1);
    expect(Object.keys(body.results[0]).sort()).toEqual(commentResponseFields);
  });

  it("returns an empty list when the restaurant has no comments", async () => {
    const response = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/comments`)
      .expect(200);

    expect(response.body).toEqual({ results: [] });
  });

  it("returns not found when listing comments for a missing restaurant", async () => {
    await request(app.getHttpServer()).get("/restaurants/2147483647/comments").expect(404);
  });

  it("creates a comment for the authenticated user", async () => {
    const response = await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/comments`)
      .set("Cookie", authenticationCookies)
      .send({ rating: 4, body: "Great food and good service." })
      .expect(201);
    const body = response.body as CommentResponseBody;

    expect(Object.keys(body).sort()).toEqual(commentResponseFields);
    expect(body).toMatchObject({
      restaurantId,
      userId,
      name: "roberto",
      rating: 4,
      body: "Great food and good service.",
    });
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rejects comment mutations without authentication", async () => {
    await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/comments`)
      .send({ rating: 4, body: "Great food." })
      .expect(401);
    await request(app.getHttpServer()).patch("/comments/1").send({ rating: 5 }).expect(401);
    await request(app.getHttpServer()).delete("/comments/1").expect(401);
  });

  it("rejects invalid comment input", async () => {
    await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/comments`)
      .set("Cookie", authenticationCookies)
      .send({ rating: 0, body: "Great food." })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/comments`)
      .set("Cookie", authenticationCookies)
      .send({ rating: 6, body: "Great food." })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/comments`)
      .set("Cookie", authenticationCookies)
      .send({ rating: 4, body: "   " })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/comments`)
      .set("Cookie", authenticationCookies)
      .send({ rating: 4, body: "a".repeat(1001) })
      .expect(400);
    await request(app.getHttpServer())
      .patch("/comments/1")
      .set("Cookie", authenticationCookies)
      .send({})
      .expect(400);
  });

  it("rejects invalid restaurant and comment ids", async () => {
    await request(app.getHttpServer()).get("/restaurants/not-a-number/comments").expect(400);
    await request(app.getHttpServer())
      .patch("/comments/0")
      .set("Cookie", authenticationCookies)
      .send({ rating: 5 })
      .expect(400);
    await request(app.getHttpServer())
      .delete("/comments/not-a-number")
      .set("Cookie", authenticationCookies)
      .expect(400);
  });

  it("allows the comment author to update a comment", async () => {
    const comment = await createComment(userId, "roberto");

    const response = await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set("Cookie", authenticationCookies)
      .send({ rating: 5, body: "Updated review." })
      .expect(200);
    const body = response.body as CommentResponseBody;

    expect(body).toMatchObject({
      id: comment.id,
      rating: 5,
      body: "Updated review.",
    });
  });

  it("rejects update by a different authenticated user", async () => {
    const comment = await createComment(userId, "roberto");

    await request(app.getHttpServer())
      .patch(`/comments/${comment.id}`)
      .set("Cookie", otherAuthenticationCookies)
      .send({ rating: 5 })
      .expect(403);
  });

  it("allows the comment author to delete a comment", async () => {
    const comment = await createComment(userId, "roberto");

    await request(app.getHttpServer())
      .delete(`/comments/${comment.id}`)
      .set("Cookie", authenticationCookies)
      .expect(204);

    await expect(prisma.comment.findUnique({ where: { id: comment.id } })).resolves.toBeNull();
  });

  it("rejects delete by a different authenticated user", async () => {
    const comment = await createComment(otherUserId, "lautaro");

    await request(app.getHttpServer())
      .delete(`/comments/${comment.id}`)
      .set("Cookie", authenticationCookies)
      .expect(403);
  });

  it("returns not found for missing comments", async () => {
    await request(app.getHttpServer())
      .patch("/comments/2147483647")
      .set("Cookie", authenticationCookies)
      .send({ rating: 5 })
      .expect(404);
    await request(app.getHttpServer())
      .delete("/comments/2147483647")
      .set("Cookie", authenticationCookies)
      .expect(404);
  });

  async function createComment(commentUserId: number, name: string) {
    return prisma.comment.create({
      data: {
        userId: commentUserId,
        restaurantId,
        name,
        date: "2026-06-21",
        rating: 4,
        body: "Great food.",
      },
    });
  }

  afterAll(async () => {
    if (prisma && restaurantId) {
      await prisma.comment.deleteMany({ where: { restaurantId } });
      await prisma.restaurant.delete({ where: { id: restaurantId } });
    }
    await app?.close();
  });
});
