import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { PublicUser } from "../auth/auth.repository";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ReservationIdParamDto } from "./dto/reservation-id-param.dto";
import { ReservationResponse, ReservationsService } from "./reservations.service";

interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post("reservations")
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponse> {
    return this.reservationsService.create(request.user.id, createReservationDto);
  }

  @Get("me/reservations")
  findMine(@Req() request: AuthenticatedRequest): Promise<ReservationResponse[]> {
    return this.reservationsService.findMine(request.user.id);
  }

  @Get("reservations/:reservationId")
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param() params: ReservationIdParamDto,
  ): Promise<ReservationResponse> {
    return this.reservationsService.findOne(request.user.id, params.reservationId);
  }

  @Patch("reservations/:reservationId/cancel")
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param() params: ReservationIdParamDto,
  ): Promise<ReservationResponse> {
    return this.reservationsService.cancel(request.user.id, params.reservationId);
  }
}
