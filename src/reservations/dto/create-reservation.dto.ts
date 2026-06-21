import { IsDateString, IsInt, IsNotEmpty, IsString, Matches, Min, Max } from "class-validator";

export class CreateReservationDto {
  @IsInt()
  @Min(1)
  restaurantId!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true, strictSeparator: true })
  date!: string;

  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  time!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  partySize!: number;
}
