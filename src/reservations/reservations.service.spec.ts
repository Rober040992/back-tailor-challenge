import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { Reservation } from "@prisma/client";
import { AvailabilityCalculator } from "../availability/availability.calculator";
import { AvailabilityRestaurantRecord } from "../availability/availability.repository";
import { ReservationsRepository, ReservationTransaction } from "./reservations.repository";
import { ReservationsService } from "./reservations.service";

const reservationSettings = {
  slotIntervalMinutes: 30,
  defaultSlotCapacity: 8,
  serviceWindows: [{ start: "13:00", end: "14:00" }],
  bookedSlots: [{ date: "2026-07-10", time: "13:00", reservedSeats: 8 }],
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

function createReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    userId: 1,
    restaurantId: 1,
    date: "2026-07-10",
    time: "13:30",
    partySize: 2,
    status: "confirmed",
    createdAt: new Date("2026-06-20T10:00:00.000Z"),
    updatedAt: new Date("2026-06-20T10:00:00.000Z"),
    cancelledAt: null,
    ...overrides,
  };
}

describe("ReservationsService", () => {
  let reservationsService: ReservationsService;
  let reservationsRepository: {
    runSerializableTransaction: jest.Mock;
    findByUserId: jest.MockedFunction<ReservationsRepository["findByUserId"]>;
    findById: jest.MockedFunction<ReservationsRepository["findById"]>;
    cancelConfirmed: jest.MockedFunction<ReservationsRepository["cancelConfirmed"]>;
  };
  let transaction: {
    findRestaurantAvailabilityData: jest.MockedFunction<
      ReservationTransaction["findRestaurantAvailabilityData"]
    >;
    createReservation: jest.MockedFunction<ReservationTransaction["createReservation"]>;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-20T10:00:00.000Z"));

    transaction = {
      findRestaurantAvailabilityData: jest.fn(),
      createReservation: jest.fn(),
    };
    reservationsRepository = {
      runSerializableTransaction: jest.fn(
        async (operation: (value: ReservationTransaction) => Promise<unknown>) =>
          operation(transaction),
      ),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      cancelConfirmed: jest.fn(),
    };
    reservationsService = new ReservationsService(
      reservationsRepository as unknown as ReservationsRepository,
      new AvailabilityCalculator(),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates a confirmed reservation when the slot has enough available seats", async () => {
    const reservation = createReservation();
    transaction.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());
    transaction.createReservation.mockResolvedValue(reservation);

    await expect(
      reservationsService.create(1, {
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:30",
        partySize: 2,
      }),
    ).resolves.toEqual(reservation);
    expect(transaction.createReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        status: "confirmed",
      }),
    );
  });

  it("rejects overbooking with conflict", async () => {
    transaction.findRestaurantAvailabilityData.mockResolvedValue(
      createRestaurantRecord({
        reservations: [{ time: "13:30", partySize: 7 }],
      }),
    );

    await expect(
      reservationsService.create(1, {
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:30",
        partySize: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.createReservation).not.toHaveBeenCalled();
  });

  it("rejects reservation creation in the past using UTC", async () => {
    await expect(
      reservationsService.create(1, {
        restaurantId: 1,
        date: "2026-06-20",
        time: "09:59",
        partySize: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(reservationsRepository.runSerializableTransaction).not.toHaveBeenCalled();
  });

  it("rejects reservation creation for a time outside generated slots", async () => {
    transaction.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());

    await expect(
      reservationsService.create(1, {
        restaurantId: 1,
        date: "2026-07-10",
        time: "14:00",
        partySize: 2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.createReservation).not.toHaveBeenCalled();
  });

  it("rejects creation when seeded booked slots leave insufficient seats", async () => {
    transaction.findRestaurantAvailabilityData.mockResolvedValue(createRestaurantRecord());

    await expect(
      reservationsService.create(1, {
        restaurantId: 1,
        date: "2026-07-10",
        time: "13:00",
        partySize: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("lists only reservations requested for the authenticated user", async () => {
    const reservations = [createReservation()];
    reservationsRepository.findByUserId.mockResolvedValue(reservations);

    await expect(reservationsService.findMine(1)).resolves.toEqual(reservations);
    expect(reservationsRepository.findByUserId).toHaveBeenCalledWith(1);
  });

  it("keeps the repository creation-time descending order", async () => {
    const reservations = [
      createReservation({ id: 2, createdAt: new Date("2026-06-20T11:00:00.000Z") }),
      createReservation({ id: 1, createdAt: new Date("2026-06-20T10:00:00.000Z") }),
    ];
    reservationsRepository.findByUserId.mockResolvedValue(reservations);

    await expect(reservationsService.findMine(1)).resolves.toEqual(reservations);
  });

  it("cancels an owned confirmed reservation and sets cancelledAt", async () => {
    const confirmedReservation = createReservation();
    const cancelledReservation = createReservation({
      status: "cancelled",
      cancelledAt: new Date("2026-06-20T10:00:00.000Z"),
    });
    reservationsRepository.findById.mockResolvedValue(confirmedReservation);
    reservationsRepository.cancelConfirmed.mockResolvedValue(cancelledReservation);

    await expect(reservationsService.cancel(1, 1)).resolves.toEqual(cancelledReservation);
    expect(reservationsRepository.cancelConfirmed).toHaveBeenCalledWith(
      1,
      new Date("2026-06-20T10:00:00.000Z"),
    );
  });

  it("returns conflict when cancelling an already cancelled reservation", async () => {
    reservationsRepository.findById.mockResolvedValue(
      createReservation({
        status: "cancelled",
        cancelledAt: new Date("2026-06-20T09:00:00.000Z"),
      }),
    );

    await expect(reservationsService.cancel(1, 1)).rejects.toBeInstanceOf(ConflictException);
    expect(reservationsRepository.cancelConfirmed).not.toHaveBeenCalled();
  });
});
