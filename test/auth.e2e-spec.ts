import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { compare } from "bcrypt";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

describe("Authentication (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const registrationRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const registrationEmails = new Set<string>();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  it("registers a user without returning the password hash or setting a cookie", async () => {
    const email = `registration-${registrationRunId}@example.com`;
    const username = `registration-${registrationRunId}`;
    registrationEmails.add(email);

    const response = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email,
        username,
        password: "Password123",
      })
      .expect(201);
    const storedUser = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    expect(response.body).toEqual({
      id: storedUser.id,
      email,
      username,
      createdAt: storedUser.createdAt.toISOString(),
      updatedAt: storedUser.updatedAt.toISOString(),
    });
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(storedUser.passwordHash).not.toBe("Password123");
    await expect(compare("Password123", storedUser.passwordHash)).resolves.toBe(true);
  });

  it("returns the shared validation error for missing registration fields", async () => {
    const response = await request(app.getHttpServer()).post("/auth/register").send({}).expect(400);
    const responseBody = response.body as ErrorResponseBody;

    expect(responseBody).toMatchObject({
      statusCode: 400,
      error: "BAD_REQUEST",
      message: "Validation failed.",
      path: "/auth/register",
    });
    expect(responseBody.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "email" }),
        expect.objectContaining({ field: "username" }),
        expect.objectContaining({ field: "password" }),
      ]),
    );
  });

  it("returns bad request for an invalid registration email", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "not-an-email",
        username: `invalid-email-${registrationRunId}`,
        password: "Password123",
      })
      .expect(400);
    const responseBody = response.body as ErrorResponseBody;

    expect(responseBody.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "email" })]),
    );
  });

  it("returns conflict when the registration email already exists", async () => {
    const email = `duplicate-email-${registrationRunId}@example.com`;
    registrationEmails.add(email);

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email,
        username: `duplicate-email-first-${registrationRunId}`,
        password: "Password123",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email,
        username: `duplicate-email-second-${registrationRunId}`,
        password: "Password123",
      })
      .expect(409);
  });

  it("returns conflict when the registration username already exists", async () => {
    const firstEmail = `duplicate-username-first-${registrationRunId}@example.com`;
    const secondEmail = `duplicate-username-second-${registrationRunId}@example.com`;
    const username = `duplicate-username-${registrationRunId}`;
    registrationEmails.add(firstEmail);
    registrationEmails.add(secondEmail);

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: firstEmail,
        username,
        password: "Password123",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: secondEmail,
        username,
        password: "Password123",
      })
      .expect(409);
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

  it("returns the current authenticated user with a valid authentication cookie", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        username: "roberto",
        password: "12345",
      })
      .expect(200);
    const cookies = loginResponse.headers["set-cookie"] as unknown as string[];

    const response = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Cookie", cookies)
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      email: "roberto@example.com",
      username: "roberto",
    });
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("rejects the current-user endpoint without an authentication cookie", async () => {
    const response = await request(app.getHttpServer()).get("/auth/me").expect(401);
    const responseBody = response.body as ErrorResponseBody;

    expect(responseBody).toMatchObject({
      statusCode: 401,
      error: "UNAUTHORIZED",
      message: "Unauthorized",
      path: "/auth/me",
    });
    expect(responseBody.timestamp).toEqual(expect.any(String));
  });

  it("rejects the current-user endpoint with an invalid authentication cookie", async () => {
    const response = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Cookie", "access_token=invalid-token")
      .expect(401);
    const responseBody = response.body as ErrorResponseBody;

    expect(responseBody).toMatchObject({
      statusCode: 401,
      error: "UNAUTHORIZED",
      message: "Unauthorized",
      path: "/auth/me",
    });
    expect(responseBody.timestamp).toEqual(expect.any(String));
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
    expect(responseBody.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "username" }),
        expect.objectContaining({ field: "password" }),
      ]),
    );
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

    const logoutResponse = await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Cookie", cookies)
      .expect(204);
    const clearedCookies = logoutResponse.headers["set-cookie"] as unknown as string[];

    expect(clearedCookies[0]).toContain("access_token=");
    expect(clearedCookies[0]).toContain("Expires=Thu, 01 Jan 1970");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [...registrationEmails],
        },
      },
    });
    await app.close();
  });
});
