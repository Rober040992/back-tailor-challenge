import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReservationStatus } from "@prisma/client";

export class ReservationResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 1 })
  restaurantId!: number;

  @ApiProperty({ example: "Mission Chinese Food" })
  restaurantName!: string;

  @ApiProperty({ example: "2026-07-10" })
  date!: string;

  @ApiProperty({ example: "13:30" })
  time!: string;

  @ApiProperty({ example: 4 })
  partySize!: number;

  @ApiProperty({ enum: ReservationStatus, example: ReservationStatus.confirmed })
  status!: ReservationStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: String, format: "date-time", nullable: true })
  cancelledAt!: Date | null;
}
