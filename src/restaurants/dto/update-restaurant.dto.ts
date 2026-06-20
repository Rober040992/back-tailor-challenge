import type { Prisma } from "@prisma/client";
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  photograph?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  capacity?: number;

  @IsOptional()
  @IsObject()
  operatingHours?: Prisma.InputJsonValue;

  @IsOptional()
  @IsObject()
  reservationSettings?: Prisma.InputJsonValue;
}
