import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: "Excellent food and service.", maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "body must contain non-whitespace characters" })
  @MaxLength(1000)
  body!: string;
}
