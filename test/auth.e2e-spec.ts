import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { compare } from "bcrypt";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

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

    expect(response.body).toEqual(
      expect.objectContaining({
        id: storedUser.id,
        email,
        username,
      }),
    );
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.headers["set-cookie"]).toBeUndefined();
    await expect(compare("Password123", storedUser.passwordHash)).resolves.toBe(true);
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
    await request(app.getHttpServer()).get("/auth/me").expect(401);
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

    const unknownUserBody = unknownUserResponse.body as { message: string };
    const invalidPasswordBody = invalidPasswordResponse.body as { message: string };

    expect(invalidPasswordBody.message).toBe(unknownUserBody.message);
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
