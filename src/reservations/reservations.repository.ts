import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AvailabilityRestaurantRecord } from "../availability/availability.repository";
import { PrismaService } from "../prisma/prisma.service";

const MAX_TRANSACTION_ATTEMPTS = 3;

export class ReservationTransactionConflictError extends Error {}

type AvailabilityCheck = (restaurant: AvailabilityRestaurantRecord | null) => void;

const reservationResponseSelect = {
  id: true,
  userId: true,
  restaurantId: true,
  date: true,
  time: true,
  partySize: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  cancelledAt: true,
  restaurant: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.ReservationSelect;

export type ReservationRecord = Prisma.ReservationGetPayload<{
  select: typeof reservationResponseSelect;
}>;

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithAvailabilityCheck(
    data: Prisma.ReservationUncheckedCreateInput,
    checkAvailability: AvailabilityCheck,
  ): Promise<ReservationRecord> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async transaction => {
            const restaurant = await transaction.restaurant.findUnique({
              where: { id: data.restaurantId },
              select: {
                id: true,
                reservationSettings: true,
                reservations: {
                  where: {
                    date: data.date,
                    status: "confirmed",
                  },
                  select: {
                    time: true,
                    partySize: true,
                  },
                },
              },
            });

            checkAvailability(restaurant);

            return transaction.reservation.create({
              data,
              select: reservationResponseSelect,
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const isRetryableConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

        if (!isRetryableConflict) {
          throw error;
        }

        if (attempt === MAX_TRANSACTION_ATTEMPTS) {
          throw new ReservationTransactionConflictError();
        }
      }
    }

    throw new ReservationTransactionConflictError();
  }

  findByUserId(userId: number): Promise<ReservationRecord[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      select: reservationResponseSelect,
    });
  }

  findById(id: number): Promise<ReservationRecord | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
      select: reservationResponseSelect,
    });
  }

  async cancelConfirmed(id: number, cancelledAt: Date): Promise<ReservationRecord | null> {
    const result = await this.prisma.reservation.updateMany({
      where: {
        id,
        status: "confirmed",
      },
      data: {
        status: "cancelled",
        cancelledAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(id);
  }
}
