import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import type { PublicUser } from "../auth/auth.repository";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ReservationIdParamDto } from "./dto/reservation-id-param.dto";
import { ReservationResponse } from "./reservation-response";
import { ReservationsService } from "./reservations.service";

interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Controller()
@UseGuards(JwtAuthGuard)
@ApiTags("reservations")
@ApiCookieAuth("access_token")
@ApiUnauthorizedResponse({ description: "Authentication is required." })
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post("reservations")
  @ApiOperation({ summary: "Create a reservation" })
  @ApiCreatedResponse({
    description: "Reservation created successfully.",
    type: ReservationResponse,
  })
  @ApiBadRequestResponse({ description: "The request or selected time slot is invalid." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  @ApiConflictResponse({ description: "The selected slot does not have enough capacity." })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponse> {
    return this.reservationsService.create(request.user.id, createReservationDto);
  }

  @Get("me/reservations")
  @ApiOperation({ summary: "List the authenticated user's reservations" })
  @ApiOkResponse({
    description: "Reservations returned successfully.",
    type: [ReservationResponse],
  })
  findMine(@Req() request: AuthenticatedRequest): Promise<ReservationResponse[]> {
    return this.reservationsService.findMine(request.user.id);
  }

  @Get("reservations/:reservationId")
  @ApiOperation({ summary: "Get an owned reservation by ID" })
  @ApiParam({ name: "reservationId", type: Number, example: 1 })
  @ApiOkResponse({ description: "Reservation returned successfully.", type: ReservationResponse })
  @ApiBadRequestResponse({ description: "The reservation ID is invalid." })
  @ApiForbiddenResponse({ description: "The reservation belongs to another user." })
  @ApiNotFoundResponse({ description: "The reservation does not exist." })
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param() params: ReservationIdParamDto,
  ): Promise<ReservationResponse> {
    return this.reservationsService.findOne(request.user.id, params.reservationId);
  }

  @Patch("reservations/:reservationId/cancel")
  @ApiOperation({ summary: "Cancel an owned reservation" })
  @ApiParam({ name: "reservationId", type: Number, example: 1 })
  @ApiOkResponse({ description: "Reservation cancelled successfully.", type: ReservationResponse })
  @ApiBadRequestResponse({ description: "The reservation ID is invalid." })
  @ApiForbiddenResponse({ description: "The reservation belongs to another user." })
  @ApiNotFoundResponse({ description: "The reservation does not exist." })
  @ApiConflictResponse({ description: "The reservation is already cancelled." })
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param() params: ReservationIdParamDto,
  ): Promise<ReservationResponse> {
    return this.reservationsService.cancel(request.user.id, params.reservationId);
  }
}
