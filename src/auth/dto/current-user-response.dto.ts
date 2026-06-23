import { ApiProperty } from "@nestjs/swagger";

export class CurrentUserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "roberto" })
  username!: string;
}
