import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNotEmpty, IsString, Matches, Min, Max } from "class-validator";

export class CreateReservationDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  restaurantId!: number;

  @ApiProperty({ example: "2026-07-10", format: "date" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true, strictSeparator: true })
  date!: string;

  @ApiProperty({ example: "13:30", pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d$" })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  time!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  partySize!: number;
}
