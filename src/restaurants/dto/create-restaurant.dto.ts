import { ApiProperty } from "@nestjs/swagger";
import type { Prisma } from "@prisma/client";
import { IsDefined, IsInt, IsNumber, IsObject, IsString, Max, Min } from "class-validator";

export class CreateRestaurantDto {
  @ApiProperty({ example: "The Example Table" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "Downtown" })
  @IsString()
  neighborhood!: string;

  @ApiProperty({ example: "123 Example Street" })
  @IsString()
  address!: string;

  @ApiProperty({ example: 40.4168, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: -3.7038, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiProperty({ example: "https://example.com/restaurant.jpg" })
  @IsString()
  image!: string;

  @ApiProperty({ example: "https://example.com/restaurant-detail.jpg" })
  @IsString()
  photograph!: string;

  @ApiProperty({ example: "Mediterranean" })
  @IsString()
  cuisineType!: string;

  @ApiProperty({ example: "Seasonal Mediterranean cuisine." })
  @IsString()
  description!: string;

  @ApiProperty({ example: 40, minimum: 1, maximum: 999 })
  @IsInt()
  @Min(1)
  @Max(999)
  capacity!: number;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    example: { monday: { open: "12:00", close: "23:00" } },
  })
  @IsDefined()
  @IsObject()
  operatingHours!: Prisma.InputJsonValue;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    example: {
      slotIntervalMinutes: 30,
      serviceWindows: [{ start: "12:00", end: "16:00", capacity: 20 }],
      bookedSlots: [],
    },
  })
  @IsDefined()
  @IsObject()
  reservationSettings!: Prisma.InputJsonValue;
}
