import { ApiProperty } from "@nestjs/swagger";

export class AvailabilitySlotResponse {
  @ApiProperty({ example: "13:30" })
  time!: string;

  @ApiProperty({ example: 20 })
  capacity!: number;

  @ApiProperty({ example: 6 })
  reservedSeats!: number;

  @ApiProperty({ example: 14 })
  availableSeats!: number;

  @ApiProperty({ example: true })
  available!: boolean;
}

export class AvailabilityResponse {
  @ApiProperty({ example: 1 })
  restaurantId!: number;

  @ApiProperty({ example: "2026-07-10" })
  date!: string;

  @ApiProperty({ type: [AvailabilitySlotResponse] })
  slots!: AvailabilitySlotResponse[];
}
