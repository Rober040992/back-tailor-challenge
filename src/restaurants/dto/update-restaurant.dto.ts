import { ApiPropertyOptional } from "@nestjs/swagger";
import type { Prisma } from "@prisma/client";
import { IsInt, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateRestaurantDto {
  @ApiPropertyOptional({ example: "The Updated Table" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Downtown" })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: "123 Example Street" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 40.4168 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -3.7038 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: "https://example.com/restaurant.jpg" })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: "https://example.com/restaurant-detail.jpg" })
  @IsOptional()
  @IsString()
  photograph?: string;

  @ApiPropertyOptional({ example: "Mediterranean" })
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @ApiPropertyOptional({ example: "Updated restaurant description." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  capacity?: number;

  @ApiPropertyOptional({ type: Object, additionalProperties: true })
  @IsOptional()
  @IsObject()
  operatingHours?: Prisma.InputJsonValue;

  @ApiPropertyOptional({ type: Object, additionalProperties: true })
  @IsOptional()
  @IsObject()
  reservationSettings?: Prisma.InputJsonValue;
}
