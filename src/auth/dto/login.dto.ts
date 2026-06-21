import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "roberto" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "your-password", format: "password" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
