import { ApiProperty } from "@nestjs/swagger";

export class RegisteredUserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "roberto" })
  username!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
