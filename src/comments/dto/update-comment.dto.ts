import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: "Updated comment.", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "body must contain non-whitespace characters" })
  @MaxLength(1000)
  body?: string;
}
