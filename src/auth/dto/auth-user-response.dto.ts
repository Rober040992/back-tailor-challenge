import { ApiProperty } from "@nestjs/swagger";

export class AuthUserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: "roberto" })
  username!: string;
}
