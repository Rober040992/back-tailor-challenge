import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class RestaurantIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restaurantId!: number;
}
