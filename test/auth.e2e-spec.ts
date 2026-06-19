import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

describe("Authentication (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it("logs in a seeded user and sets the authentication cookie", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        username: "roberto",
        password: "12345",
      })
      .expect(200);
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const accessTokenCookie = cookies.find(cookie => cookie.startsWith("access_token="));

    expect(response.body).toEqual({
      id: 1,
      username: "roberto",
    });
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(accessTokenCookie).toContain("HttpOnly");
    expect(accessTokenCookie).toContain("Max-Age=86400");
    expect(accessTokenCookie).toContain("SameSite=Lax");
    expect(accessTokenCookie).not.toContain("Secure");
  });

  it("returns the shared validation error for missing credentials", async () => {
    const response = await request(app.getHttpServer()).post("/auth/login").send({}).expect(400);
    const responseBody = response.body as ErrorResponseBody;

    expect(responseBody).toMatchObject({
      statusCode: 400,
      error: "BAD_REQUEST",
      message: "Validation failed.",
      path: "/auth/login",
    });
    expect(responseBody.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: "username" }), expect.objectContaining({ field: "password" })]));
  });

  it("does not reveal which credential is invalid", async () => {
    const unknownUserResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        username: "unknown",
        password: "12345",
      })
      .expect(401);
    const invalidPasswordResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        username: "roberto",
        password: "wrong-password",
      })
      .expect(401);
    const unknownUserBody = unknownUserResponse.body as ErrorResponseBody;
    const invalidPasswordBody = invalidPasswordResponse.body as ErrorResponseBody;

    expect(unknownUserBody.message).toBe("Invalid username or password.");
    expect(invalidPasswordBody.message).toBe(unknownUserBody.message);
  });

  it("rejects logout without an authenticated session", async () => {
    await request(app.getHttpServer()).post("/auth/logout").expect(401);
  });

  it("clears the authentication cookie on logout", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        username: "roberto",
        password: "12345",
      })
      .expect(200);
    const cookies = loginResponse.headers["set-cookie"] as unknown as string[];

    const logoutResponse = await request(app.getHttpServer()).post("/auth/logout").set("Cookie", cookies).expect(204);
    const clearedCookies = logoutResponse.headers["set-cookie"] as unknown as string[];

    expect(clearedCookies[0]).toContain("access_token=");
    expect(clearedCookies[0]).toContain("Expires=Thu, 01 Jan 1970");
  });

  afterAll(async () => {
    await app.close();
  });
});
