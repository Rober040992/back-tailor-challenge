import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Reservation } from "@prisma/client";
import { AvailabilityCalculator } from "../availability/availability.calculator";
import { logSafely } from "../common/logging/safe-logger";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import {
  ReservationsRepository,
  ReservationTransactionConflictError,
} from "./reservations.repository";
import { ReservationResponse } from "./reservation-response";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";
const RESERVATION_NOT_FOUND_MESSAGE = "Reservation not found.";
const RESERVATION_FORBIDDEN_MESSAGE = "Reservation belongs to another user.";
const RESERVATION_IN_PAST_MESSAGE = "Reservation cannot be created in the past.";
const INVALID_TIME_SLOT_MESSAGE = "Reservation time does not match an available slot.";
const CAPACITY_CONFLICT_MESSAGE = "The selected slot no longer has enough capacity.";
const ALREADY_CANCELLED_MESSAGE = "Reservation is already cancelled.";

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly reservationsRepository: ReservationsRepository,
    private readonly availabilityCalculator: AvailabilityCalculator,
  ) {}

  async create(
    userId: number,
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponse> {
    this.validateNotInPast(createReservationDto.date, createReservationDto.time);

    try {
      const reservation = await this.reservationsRepository.createWithAvailabilityCheck(
        {
          userId,
          restaurantId: createReservationDto.restaurantId,
          date: createReservationDto.date,
          time: createReservationDto.time,
          partySize: createReservationDto.partySize,
          status: "confirmed",
        },
        restaurant => {
          if (!restaurant) {
            throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
          }

          const availability = this.availabilityCalculator.calculate(
            restaurant,
            createReservationDto.date,
            createReservationDto.partySize,
          );
          const selectedSlot = availability.slots.find(
            slot => slot.time === createReservationDto.time,
          );

          if (!selectedSlot) {
            throw new BadRequestException(INVALID_TIME_SLOT_MESSAGE);
          }

          if (!selectedSlot.available) {
            this.logCapacityConflict(userId, createReservationDto, selectedSlot.availableSeats);
            throw new ConflictException(CAPACITY_CONFLICT_MESSAGE);
          }
        },
      );

      logSafely(
        this.logger,
        "log",
        `[RESERVATION] created reservationId=${reservation.id} restaurantId=${reservation.restaurantId} userId=${userId} date=${reservation.date} time=${reservation.time} partySize=${reservation.partySize}`,
      );

      return reservation;
    } catch (error) {
      if (error instanceof ReservationTransactionConflictError) {
        this.logCapacityConflict(userId, createReservationDto);
        throw new ConflictException(CAPACITY_CONFLICT_MESSAGE);
      }

      throw error;
    }
  }

  findMine(userId: number): Promise<ReservationResponse[]> {
    return this.reservationsRepository.findByUserId(userId);
  }

  async findOne(userId: number, reservationId: number): Promise<ReservationResponse> {
    return this.findOwnedReservation(userId, reservationId);
  }

  async cancel(userId: number, reservationId: number): Promise<ReservationResponse> {
    const reservation = await this.findOwnedReservation(userId, reservationId);

    if (reservation.status === "cancelled") {
      throw new ConflictException(ALREADY_CANCELLED_MESSAGE);
    }

    const cancelledReservation = await this.reservationsRepository.cancelConfirmed(
      reservationId,
      new Date(),
    );

    if (!cancelledReservation) {
      throw new ConflictException(ALREADY_CANCELLED_MESSAGE);
    }

    logSafely(
      this.logger,
      "log",
      `[RESERVATION] cancelled reservationId=${cancelledReservation.id} restaurantId=${cancelledReservation.restaurantId} userId=${userId}`,
    );

    return cancelledReservation;
  }

  private logCapacityConflict(
    userId: number,
    reservation: CreateReservationDto,
    availableSeats?: number,
  ): void {
    logSafely(
      this.logger,
      "warn",
      `[RESERVATION] capacity conflict restaurantId=${reservation.restaurantId} date=${reservation.date} time=${reservation.time} partySize=${reservation.partySize}${availableSeats === undefined ? "" : ` availableSeats=${availableSeats}`} userId=${userId}`,
    );
  }

  private async findOwnedReservation(userId: number, reservationId: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findById(reservationId);

    if (!reservation) {
      throw new NotFoundException(RESERVATION_NOT_FOUND_MESSAGE);
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException(RESERVATION_FORBIDDEN_MESSAGE);
    }

    return reservation;
  }

  private validateNotInPast(date: string, time: string): void {
    const reservationDateTime = new Date(`${date}T${time}:00.000Z`);

    if (reservationDateTime.getTime() < Date.now()) {
      throw new BadRequestException(RESERVATION_IN_PAST_MESSAGE);
    }
  }
}
