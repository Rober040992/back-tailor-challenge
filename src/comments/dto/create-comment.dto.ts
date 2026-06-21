import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class CreateCommentDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "body must contain non-whitespace characters" })
  @MaxLength(1000)
  body!: string;
}
