import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Prisma } from "@prisma/client";
import { IsInt, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateRestaurantDto {
  @ApiProperty({ example: "The Example Table" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Downtown" })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiProperty({ example: "123 Example Street" })
  @IsString()
  address!: string;

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

  @ApiProperty({ example: "Seasonal Mediterranean cuisine." })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  capacity?: number;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    example: { monday: { open: "12:00", close: "23:00" } },
  })
  @IsOptional()
  @IsObject()
  operatingHours?: Prisma.InputJsonValue;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    example: {
      slotIntervalMinutes: 30,
      serviceWindows: [{ start: "12:00", end: "16:00", capacity: 20 }],
      bookedSlots: [],
    },
  })
  @IsOptional()
  @IsObject()
  reservationSettings?: Prisma.InputJsonValue;
}
