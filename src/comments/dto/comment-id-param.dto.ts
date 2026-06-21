import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class CommentIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  commentId!: number;
}
