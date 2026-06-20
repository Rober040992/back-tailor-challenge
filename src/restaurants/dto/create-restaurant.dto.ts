import type { Prisma } from "@prisma/client";
import { IsDefined, IsInt, IsNumber, IsObject, IsString, Max, Min } from "class-validator";

export class CreateRestaurantDto {
  @IsString()
  name!: string;

  @IsString()
  neighborhood!: string;

  @IsString()
  address!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsString()
  image!: string;

  @IsString()
  photograph!: string;

  @IsString()
  cuisineType!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1)
  @Max(999)
  capacity!: number;

  @IsDefined()
  @IsObject()
  operatingHours!: Prisma.InputJsonValue;

  @IsDefined()
  @IsObject()
  reservationSettings!: Prisma.InputJsonValue;
}
