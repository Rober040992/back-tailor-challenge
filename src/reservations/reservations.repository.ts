import { Injectable } from "@nestjs/common";
import { Prisma, Reservation } from "@prisma/client";
import { AvailabilityRestaurantRecord } from "../availability/availability.repository";
import { PrismaService } from "../prisma/prisma.service";

const MAX_TRANSACTION_ATTEMPTS = 3;

export class ReservationTransactionConflictError extends Error {}

type AvailabilityCheck = (restaurant: AvailabilityRestaurantRecord | null) => void;

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithAvailabilityCheck(
    data: Prisma.ReservationUncheckedCreateInput,
    checkAvailability: AvailabilityCheck,
  ): Promise<Reservation> {
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

  findByUserId(userId: number): Promise<Reservation[]> {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(id: number): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
    });
  }

  async cancelConfirmed(id: number, cancelledAt: Date): Promise<Reservation | null> {
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
