import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min, Max } from "class-validator";

export class ReservationIdParamDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 99999 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99999)
  reservationId!: number;
}
