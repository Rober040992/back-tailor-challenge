import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Reservation } from "@prisma/client";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Reservations (e2e)", () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authenticationCookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();

    prisma = app.get(PrismaService);
    const loginResponse = await request(app.getHttpServer()).post("/auth/login").send({
      username: "roberto",
      password: "12345",
    });
    authenticationCookies = loginResponse.headers["set-cookie"] as unknown as string[];
  });

  beforeEach(async () => {
    await prisma.reservation.deleteMany();
  });

  it("creates a confirmed reservation when the slot has enough available seats", async () => {
    const response = await request(app.getHttpServer())
      .post("/reservations")
      .set("Cookie", authenticationCookies)
      .send({
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:30",
        partySize: 2,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      restaurantId: 1,
      userId: 1,
      date: "2026-07-10",
      time: "13:30",
      partySize: 2,
      status: "confirmed",
      cancelledAt: null,
    });
  });

  it("rejects overbooking with conflict", async () => {
    await request(app.getHttpServer())
      .post("/reservations")
      .set("Cookie", authenticationCookies)
      .send({
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:30",
        partySize: 6,
      })
      .expect(409);
  });

  it("rejects reservation creation in the past", async () => {
    await request(app.getHttpServer())
      .post("/reservations")
      .set("Cookie", authenticationCookies)
      .send({
        restaurantId: 1,
        date: "2000-01-01",
        time: "13:30",
        partySize: 2,
      })
      .expect(400);
  });

  it("rejects reservation creation for a time outside generated slots", async () => {
    await request(app.getHttpServer())
      .post("/reservations")
      .set("Cookie", authenticationCookies)
      .send({
        restaurantId: 1,
        date: "2026-07-10",
        time: "15:00",
        partySize: 2,
      })
      .expect(400);
  });

  it("rejects creation when seeded booked slots leave insufficient seats", async () => {
    await request(app.getHttpServer())
      .post("/reservations")
      .set("Cookie", authenticationCookies)
      .send({
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:00",
        partySize: 1,
      })
      .expect(409);
  });

  it("lists only reservations owned by the authenticated user", async () => {
    await prisma.reservation.createMany({
      data: [
        {
          userId: 1,
          restaurantId: 1,
          date: "2026-07-10",
          time: "13:30",
          partySize: 2,
        },
        {
          userId: 2,
          restaurantId: 1,
          date: "2026-07-10",
          time: "14:00",
          partySize: 2,
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get("/me/reservations")
      .set("Cookie", authenticationCookies)
      .expect(200);
    const reservations = response.body as Reservation[];

    expect(reservations).toHaveLength(1);
    expect(reservations[0]).toMatchObject({ userId: 1 });
  });

  it("orders listed reservations by creation time descending", async () => {
    const olderReservation = await prisma.reservation.create({
      data: {
        userId: 1,
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:30",
        partySize: 2,
        createdAt: new Date("2026-06-20T10:00:00.000Z"),
      },
    });
    const newerReservation = await prisma.reservation.create({
      data: {
        userId: 1,
        restaurantId: 1,
        date: "2026-07-11",
        time: "13:30",
        partySize: 2,
        createdAt: new Date("2026-06-20T11:00:00.000Z"),
      },
    });

    const response = await request(app.getHttpServer())
      .get("/me/reservations")
      .set("Cookie", authenticationCookies)
      .expect(200);
    const reservations = response.body as Reservation[];

    expect(reservations.map(reservation => reservation.id)).toEqual([
      newerReservation.id,
      olderReservation.id,
    ]);
  });

  it("cancels an owned confirmed reservation and sets cancelledAt", async () => {
    const reservation = await createReservation(prisma);

    const response = await request(app.getHttpServer())
      .patch(`/reservations/${reservation.id}/cancel`)
      .set("Cookie", authenticationCookies)
      .expect(200);
    const responseBody = response.body as Reservation;

    expect(responseBody).toMatchObject({
      id: reservation.id,
      userId: 1,
      status: "cancelled",
    });
    expect(responseBody.cancelledAt).not.toBeNull();
  });

  it("returns conflict when cancelling an already cancelled reservation", async () => {
    const reservation = await createReservation(prisma, {
      status: "cancelled",
      cancelledAt: new Date(),
    });

    await request(app.getHttpServer())
      .patch(`/reservations/${reservation.id}/cancel`)
      .set("Cookie", authenticationCookies)
      .expect(409);
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany();
    await app.close();
  });
});

function createReservation(
  prisma: PrismaService,
  overrides: Partial<Pick<Reservation, "status" | "cancelledAt">> = {},
): Promise<Reservation> {
  return prisma.reservation.create({
    data: {
      userId: 1,
      restaurantId: 1,
      date: "2026-07-10",
      time: "13:30",
      partySize: 2,
      ...overrides,
    },
  });
}
