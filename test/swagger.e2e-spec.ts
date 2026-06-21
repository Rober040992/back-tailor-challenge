import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";

interface OpenApiDocumentBody {
  tags: Array<{ name: string }>;
  paths: Record<string, Record<string, { security?: Array<Record<string, string[]>> }>>;
  components?: {
    securitySchemes?: Record<
      string,
      {
        type: string;
        in: string;
        name: string;
      }
    >;
  };
}

describe("Swagger documentation (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it("serves the Swagger UI when Swagger is enabled", async () => {
    await request(app.getHttpServer()).get("/docs").expect(200);
  });

  it("serves the OpenAPI JSON document with all feature tags", async () => {
    const response = await request(app.getHttpServer()).get("/docs-json").expect(200);
    const responseBody = response.body as OpenApiDocumentBody;
    const tagNames = responseBody.tags.map(tag => tag.name);

    expect(tagNames).toEqual(
      expect.arrayContaining([
        "auth",
        "restaurants",
        "availability",
        "reservations",
        "favourites",
        "comments",
      ]),
    );
    expect(Object.keys(responseBody.paths)).toEqual(
      expect.arrayContaining([
        "/auth/login",
        "/auth/logout",
        "/restaurants",
        "/restaurants/{id}",
        "/restaurants/{restaurantId}/availability",
        "/reservations",
        "/me/reservations",
        "/reservations/{reservationId}",
        "/reservations/{reservationId}/cancel",
        "/me/favourites",
        "/me/favourites/{restaurantId}",
        "/restaurants/{restaurantId}/comments",
        "/comments/{commentId}",
      ]),
    );
    expect(responseBody.components?.securitySchemes?.access_token).toMatchObject({
      type: "apiKey",
      in: "cookie",
      name: "access_token",
    });
    expect(responseBody.paths["/auth/login"].post.security).toBeUndefined();
    expect(responseBody.paths["/reservations"].post.security).toEqual([{ access_token: [] }]);
  });

  afterAll(async () => {
    await app.close();
  });
});
