import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  ValidateBy,
} from "class-validator";

const IsTodayOrLater = () =>
  ValidateBy({
    name: "isTodayOrLater",
    validator: {
      validate: (value: unknown) => {
        const today = new Date();
        const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1)
          .padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        return typeof value === "string" && value >= todayDate;
      },
      defaultMessage: () => "date must not be earlier than today's date",
    },
  });

export class AvailabilityQueryDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true, strictSeparator: true })
  @IsTodayOrLater()
  date!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  partySize!: number;
}
