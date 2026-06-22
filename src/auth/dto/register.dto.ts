import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "roberto" })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: "Password123", format: "password" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
