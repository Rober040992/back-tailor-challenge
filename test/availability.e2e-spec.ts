import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { configureApplication } from "../src/app.setup";

interface AvailabilityBody {
  restaurantId: number;
  date: string;
  slots: unknown[];
}

describe("Availability (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it("returns generated slots and applies seeded booked seats", async () => {
    const response = await request(app.getHttpServer()).get("/restaurants/1/availability?date=2026-07-10&partySize=4").expect(200);
    const body = response.body as AvailabilityBody;

    expect(body).toMatchObject({
      restaurantId: 1,
      date: "2026-07-10",
    });
    expect(body.slots).toEqual(
      expect.arrayContaining([
        {
          time: "13:00",
          capacity: 8,
          reservedSeats: 8,
          availableSeats: 0,
          available: false,
        },
        {
          time: "13:30",
          capacity: 8,
          reservedSeats: 3,
          availableSeats: 5,
          available: true,
        },
      ]),
    );
    expect(body.slots).not.toEqual(expect.arrayContaining([expect.objectContaining({ time: "15:00" }), expect.objectContaining({ time: "23:00" })]));
  });

  it("returns bad request when date is missing", async () => {
    await request(app.getHttpServer()).get("/restaurants/1/availability?partySize=4").expect(400);
  });

  it("returns bad request when date is invalid", async () => {
    await request(app.getHttpServer()).get("/restaurants/1/availability?date=2026-02-30&partySize=4").expect(400);
  });

  it("returns bad request when party size is missing", async () => {
    await request(app.getHttpServer()).get("/restaurants/1/availability?date=2026-07-10").expect(400);
  });

  it("returns bad request when party size is not greater than zero", async () => {
    await request(app.getHttpServer()).get("/restaurants/1/availability?date=2026-07-10&partySize=0").expect(400);
  });

  it("returns not found when the restaurant does not exist", async () => {
    await request(app.getHttpServer()).get("/restaurants/2147483647/availability?date=2026-07-10&partySize=4").expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
