import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { AvailabilityRepository, AvailabilityRestaurantRecord } from "./availability.repository";
import { AvailabilityService } from "./availability.service";

const reservationSettings = {
  slotIntervalMinutes: 30,
  defaultSlotCapacity: 8,
  serviceWindows: [
    { name: "lunch", start: "13:00", end: "14:00" },
    { name: "dinner", start: "20:00", end: "21:00" },
  ],
  bookedSlots: [
    { date: "2026-07-10", time: "13:00", reservedSeats: 3 },
    { date: "2026-07-10", time: "20:00", reservedSeats: 10 },
  ],
};

function createRestaurantRecord(
  overrides: Partial<AvailabilityRestaurantRecord> = {},
): AvailabilityRestaurantRecord {
  return {
    id: 1,
    reservationSettings,
    reservations: [],
    ...overrides,
  };
}

describe("AvailabilityService", () => {
  let availabilityService: AvailabilityService;
  let availabilityRepository: {
    findRestaurantAvailabilityData: jest.MockedFunction<
      AvailabilityRepository["findRestaurantAvailabilityData"]
    >;
  };

  beforeEach(() => {
    availabilityRepository = {
      findRestaurantAvailabilityData: jest.fn(),
    };
    availabilityService = new AvailabilityService(
      availabilityRepository as unknown as AvailabilityRepository,
    );
  });

  it("generates lunch and dinner slots and excludes service window end times", async () => {
    availabilityRepository.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());

    const result = await availabilityService.findAvailability(1, "2026-07-12", 4);

    expect(result.slots.map(slot => slot.time)).toEqual(["13:00", "13:30", "20:00", "20:30"]);
    expect(result.slots).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ time: "14:00" }),
        expect.objectContaining({ time: "21:00" }),
      ]),
    );
  });

  it("returns full-capacity slots for a date without bookings", async () => {
    availabilityRepository.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());

    const result = await availabilityService.findAvailability(1, "2026-07-12", 8);

    expect(result.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capacity: 8,
          reservedSeats: 0,
          availableSeats: 8,
          available: true,
        }),
      ]),
    );
  });

  it("combines seeded booked seats and confirmed reservation seats", async () => {
    availabilityRepository.findRestaurantAvailabilityData.mockResolvedValue(
      createRestaurantRecord({
        reservations: [
          { time: "13:00", partySize: 2 },
          { time: "13:00", partySize: 1 },
        ],
      }),
    );

    const result = await availabilityService.findAvailability(1, "2026-07-10", 3);

    expect(result.slots).toContainEqual({
      time: "13:00",
      capacity: 8,
      reservedSeats: 6,
      availableSeats: 2,
      available: false,
    });
  });

  it("never returns available seats below zero", async () => {
    availabilityRepository.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());

    const result = await availabilityService.findAvailability(1, "2026-07-10", 1);

    expect(result.slots).toContainEqual({
      time: "20:00",
      capacity: 8,
      reservedSeats: 10,
      availableSeats: 0,
      available: false,
    });
  });

  it("marks a slot available only when it can fit the party size", async () => {
    availabilityRepository.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());

    const fittingParty = await availabilityService.findAvailability(1, "2026-07-10", 5);
    const largerParty = await availabilityService.findAvailability(1, "2026-07-10", 6);

    expect(fittingParty.slots.find(slot => slot.time === "13:00")?.available).toBe(true);
    expect(largerParty.slots.find(slot => slot.time === "13:00")?.available).toBe(false);
  });

  it("returns not found when the restaurant does not exist", async () => {
    availabilityRepository.findRestaurantAvailabilityData.mockResolvedValue(null);

    await expect(availabilityService.findAvailability(999, "2026-07-10", 4)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
