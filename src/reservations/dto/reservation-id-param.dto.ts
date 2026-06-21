import { Type } from "class-transformer";
import { IsInt, Min, Max } from "class-validator";

export class ReservationIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  reservationId!: number;
}
