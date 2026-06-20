import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsString, Matches, Min } from "class-validator";

export class AvailabilityQueryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true, strictSeparator: true })
  date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  partySize!: number;
}
