import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface AvailabilityRestaurantRecord {
  id: number;
  reservationSettings: Prisma.JsonValue;
  reservations: {
    time: string;
    partySize: number;
  }[];
}

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRestaurantAvailabilityData(id: number, date: string): Promise<AvailabilityRestaurantRecord | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        reservationSettings: true,
        reservations: {
          where: {
            date,
            status: "confirmed",
          },
          select: {
            time: true,
            partySize: true,
          },
        },
      },
    });
  }
}
